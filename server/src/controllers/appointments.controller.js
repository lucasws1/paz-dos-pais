import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";

const VALID_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELED"];

export const listAppointments = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { status } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `status inválido. Use: ${VALID_STATUSES.join(", ")}.` });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      ...(status && { status }),
    },
    orderBy: { dateTime: "asc" },
  });

  return res.json(appointments);
});

export const createAppointment = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { doctorName, specialty, dateTime, status, notes } = req.body;

  if (!doctorName || !dateTime) {
    return res
      .status(400)
      .json({ error: "doctorName e dateTime são obrigatórios." });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `status inválido. Use: ${VALID_STATUSES.join(", ")}.` });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorName,
      specialty: specialty ?? null,
      dateTime: new Date(dateTime),
      status: status ?? "SCHEDULED",
      notes: notes ?? null,
    },
  });

  return res.status(201).json(appointment);
});

export const getAppointment = catchAsync(async (req, res) => {
  const { patientId, appointmentId } = req.params;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
  });

  if (!appointment) {
    return res.status(404).json({ error: "Consulta não encontrada." });
  }

  return res.json(appointment);
});

export const updateAppointment = catchAsync(async (req, res) => {
  const { patientId, appointmentId } = req.params;
  const { doctorName, specialty, dateTime, status, notes } = req.body;

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Consulta não encontrada." });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `status inválido. Use: ${VALID_STATUSES.join(", ")}.` });
  }

  const data = {};
  if (doctorName !== undefined) data.doctorName = doctorName;
  if (specialty !== undefined) data.specialty = specialty;
  if (dateTime !== undefined) data.dateTime = new Date(dateTime);
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;

  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum campo para atualizar foi enviado." });
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
  });

  return res.json(appointment);
});

export const deleteAppointment = catchAsync(async (req, res) => {
  const { patientId, appointmentId } = req.params;

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Consulta não encontrada." });
  }

  await prisma.appointment.delete({ where: { id: appointmentId } });

  return res.status(204).send();
});
