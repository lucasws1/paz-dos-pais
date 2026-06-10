import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";

const VALID_STATUSES = ["PENDING", "TAKEN", "MISSED", "SKIPPED"];

export const listMedicationLogs = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { medicationId, status, from, to } = req.query;

  const where = { medication: { patientId } };

  if (medicationId) where.medicationId = medicationId;
  if (status) where.status = status;

  if (from || to) {
    where.scheduledFor = {};
    if (from) where.scheduledFor.gte = new Date(from);
    if (to) where.scheduledFor.lte = new Date(to);
  }

  const logs = await prisma.medicationLog.findMany({
    where,
    include: {
      medication: {
        select: { id: true, name: true, dosage: true, frequency: true },
      },
    },
    orderBy: { scheduledFor: "asc" },
  });

  return res.json(logs);
});

export const createMedicationLog = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { medicationId, scheduledFor, status, takenAt } = req.body;

  if (!medicationId || !scheduledFor) {
    return res
      .status(400)
      .json({ error: "medicationId e scheduledFor são obrigatórios." });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `status inválido. Use: ${VALID_STATUSES.join(", ")}.` });
  }

  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });

  if (!medication) {
    return res.status(404).json({ error: "Medicamento não encontrado." });
  }

  // Upsert pelo par (medicationId, scheduledFor): se o scheduler já criou o
  // log PENDING da dose, a confirmação do cuidador apenas atualiza o status.
  const log = await prisma.medicationLog.upsert({
    where: {
      medicationId_scheduledFor: {
        medicationId,
        scheduledFor: new Date(scheduledFor),
      },
    },
    create: {
      medicationId,
      scheduledFor: new Date(scheduledFor),
      status: status ?? "PENDING",
      takenAt: takenAt ? new Date(takenAt) : status === "TAKEN" ? new Date() : null,
    },
    update: {
      status: status ?? "PENDING",
      takenAt: takenAt ? new Date(takenAt) : status === "TAKEN" ? new Date() : null,
    },
  });

  return res.status(201).json(log);
});

export const updateMedicationLog = catchAsync(async (req, res) => {
  const { patientId, logId } = req.params;
  const { status, takenAt } = req.body;

  const existing = await prisma.medicationLog.findFirst({
    where: { id: logId, medication: { patientId } },
  });

  if (!existing) {
    return res.status(404).json({ error: "Registro de dose não encontrado." });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `status inválido. Use: ${VALID_STATUSES.join(", ")}.` });
  }

  const data = {};
  if (status !== undefined) {
    data.status = status;
    if (takenAt === undefined) {
      data.takenAt = status === "TAKEN" ? new Date() : null;
    }
  }
  if (takenAt !== undefined) data.takenAt = takenAt ? new Date(takenAt) : null;

  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum campo para atualizar foi enviado." });
  }

  const log = await prisma.medicationLog.update({
    where: { id: logId },
    data,
  });

  return res.json(log);
});

export const deleteMedicationLog = catchAsync(async (req, res) => {
  const { patientId, logId } = req.params;

  const existing = await prisma.medicationLog.findFirst({
    where: { id: logId, medication: { patientId } },
  });

  if (!existing) {
    return res.status(404).json({ error: "Registro de dose não encontrado." });
  }

  await prisma.medicationLog.delete({ where: { id: logId } });

  return res.status(204).send();
});
