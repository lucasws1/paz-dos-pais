import cron from "node-cron";
import prisma from "../lib/prisma.js";
import {
  sendDoseReminderEmail,
  sendAppointmentReminderEmail,
} from "./email.service.js";

/**
 * Horários de dose usam o relógio local do servidor — configure a variável
 * de ambiente TZ (ex: TZ="America/Sao_Paulo") para alinhar com a família.
 */
function currentTimeHHmm(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function caregiverEmails(patient) {
  return patient.permissions
    .filter((p) => p.role === "OWNER" || p.role === "CAREGIVER")
    .map((p) => p.user.email);
}

/**
 * Roda a cada minuto: para cada medicamento ativo com dose neste horário,
 * cria o MedicationLog PENDING e envia o lembrete por e-mail aos cuidadores.
 */
export async function processDoseReminders(now = new Date()) {
  const time = currentTimeHHmm(now);

  const medications = await prisma.medication.findMany({
    where: {
      isActive: true,
      times: { contains: time },
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: startOfToday() } }] }],
    },
    include: {
      patient: {
        include: {
          permissions: { include: { user: { select: { email: true } } } },
        },
      },
    },
  });

  for (const medication of medications) {
    // O filtro "contains" do banco é só pré-seleção; confirma o horário exato
    const times = (medication.times ?? "").split(",").map((t) => t.trim());
    if (!times.includes(time)) continue;

    const scheduledFor = new Date(now);
    scheduledFor.setSeconds(0, 0);

    try {
      // Cria o log pendente da dose; se já existir (reinício do processo no
      // mesmo minuto), pula para não enviar e-mail duplicado.
      await prisma.medicationLog.create({
        data: { medicationId: medication.id, scheduledFor, status: "PENDING" },
      });
    } catch (err) {
      if (err.code === "P2002") continue; // unique (medicationId, scheduledFor)
      console.error("[scheduler] erro ao criar log de dose:", err);
      continue;
    }

    const to = caregiverEmails(medication.patient);
    if (to.length === 0) continue;

    try {
      await sendDoseReminderEmail({
        to,
        patientName: medication.patient.name,
        medication,
        time,
      });
    } catch (err) {
      console.error("[scheduler] erro ao enviar lembrete de dose:", err);
    }
  }
}

/**
 * Roda de hora em hora: envia lembrete único para consultas SCHEDULED
 * que acontecem nas próximas 24h.
 */
export async function processAppointmentReminders(now = new Date()) {
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "SCHEDULED",
      reminderSentAt: null,
      dateTime: { gte: now, lte: in24h },
    },
    include: {
      patient: {
        include: {
          permissions: { include: { user: { select: { email: true } } } },
        },
      },
    },
  });

  for (const appointment of appointments) {
    const to = caregiverEmails(appointment.patient);

    try {
      if (to.length > 0) {
        await sendAppointmentReminderEmail({
          to,
          patientName: appointment.patient.name,
          appointment,
        });
      }
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: now },
      });
    } catch (err) {
      console.error("[scheduler] erro ao enviar lembrete de consulta:", err);
    }
  }
}

/**
 * Roda de madrugada: doses PENDING de dias anteriores viram MISSED.
 */
export async function markStaleDosesAsMissed() {
  const { count } = await prisma.medicationLog.updateMany({
    where: { status: "PENDING", scheduledFor: { lt: startOfToday() } },
    data: { status: "MISSED" },
  });

  if (count > 0) {
    console.log(`[scheduler] ${count} dose(s) pendente(s) marcada(s) como MISSED.`);
  }
}

export function startScheduler() {
  if (process.env.ENABLE_SCHEDULER === "false") {
    console.log("[scheduler] desabilitado via ENABLE_SCHEDULER=false");
    return;
  }

  cron.schedule("* * * * *", () =>
    processDoseReminders().catch((err) =>
      console.error("[scheduler] processDoseReminders falhou:", err),
    ),
  );

  cron.schedule("0 * * * *", () =>
    processAppointmentReminders().catch((err) =>
      console.error("[scheduler] processAppointmentReminders falhou:", err),
    ),
  );

  cron.schedule("10 3 * * *", () =>
    markStaleDosesAsMissed().catch((err) =>
      console.error("[scheduler] markStaleDosesAsMissed falhou:", err),
    ),
  );

  console.log("[scheduler] lembretes de dose e consulta agendados.");
}
