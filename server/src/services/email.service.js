import { Resend } from "resend";

let resend = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
 * Envia um e-mail via Resend. Sem RESEND_API_KEY configurada, apenas loga
 * (útil em desenvolvimento, sem quebrar o scheduler).
 * @param {{ to: string | string[], subject: string, html: string }} params
 */
export async function sendEmail({ to, subject, html }) {
  const client = getClient();

  if (!client) {
    console.warn(`[email] RESEND_API_KEY ausente — e-mail não enviado: "${subject}" para ${to}`);
    return null;
  }

  const { data, error } = await client.emails.send({
    from: process.env.EMAIL_FROM || "Paz dos Pais <onboarding@resend.dev>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }

  return data;
}

function layout(title, body) {
  return `
    <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a; margin-bottom: 4px;">❤️ Paz dos Pais</h2>
      <h3 style="color: #334155; margin-top: 0;">${title}</h3>
      <div style="color: #475569; font-size: 15px; line-height: 1.6;">${body}</div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
        Você recebe este e-mail por ser cuidador(a) cadastrado(a) no Paz dos Pais.
      </p>
    </div>
  `;
}

/**
 * Lembrete de dose de medicamento.
 * @param {{ to: string | string[], patientName: string, medication: object, time: string }} params
 */
export async function sendDoseReminderEmail({ to, patientName, medication, time }) {
  const safePatientName = escapeHtml(patientName);
  const safeMedicationName = escapeHtml(medication.name);
  const safeTime = escapeHtml(time);
  const details = [medication.dosage, medication.frequency].filter(Boolean).join(" · ");
  const safeDetails = escapeHtml(details);

  return sendEmail({
    to,
    subject: `💊 Hora do remédio de ${safePatientName}: ${safeMedicationName} (${safeTime})`,
    html: layout(
      `Hora do remédio — ${safeTime}`,
      `
        <p><strong>${safePatientName}</strong> deve tomar agora:</p>
        <p style="font-size: 18px; margin: 12px 0;"><strong>${safeMedicationName}</strong>${details ? `<br/><span style="font-size: 14px;">${safeDetails}</span>` : ""}</p>
        <p>Após a tomada, registre a dose no painel para manter o histórico de adesão em dia.</p>
      `,
    ),
  });
}

/**
 * Lembrete de consulta agendada nas próximas 24h.
 * @param {{ to: string | string[], patientName: string, appointment: object }} params
 */
export async function sendAppointmentReminderEmail({ to, patientName, appointment }) {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(appointment.doctorName);
  const safeSpecialty = escapeHtml(appointment.specialty);
  const safeNotes = escapeHtml(appointment.notes);
  const date = new Date(appointment.dateTime);
  const formatted = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return sendEmail({
    to,
    subject: `📅 Consulta de ${safePatientName} amanhã: ${safeDoctorName}`,
    html: layout(
      "Consulta nas próximas 24 horas",
      `
        <p><strong>${safePatientName}</strong> tem consulta marcada:</p>
        <p style="font-size: 16px; margin: 12px 0;">
          <strong>${safeDoctorName}</strong>
          ${appointment.specialty ? `<br/>${safeSpecialty}` : ""}
          <br/>🕐 ${formatted}
        </p>
        ${appointment.notes ? `<p style="font-size: 14px;">Notas: ${safeNotes}</p>` : ""}
      `,
    ),
  });
}
