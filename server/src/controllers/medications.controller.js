import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";

const VALID_SOURCES = ["MANUAL", "AI_EXTRACTION"];

export const listMedications = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { isActive, appointmentId } = req.query;

  const where = { patientId };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  if (appointmentId) {
    where.appointmentId = appointmentId;
  }

  const medications = await prisma.medication.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return res.json(medications);
});

export const createMedication = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const {
    name,
    dosage,
    frequency,
    startDate,
    endDate,
    isActive,
    source,
    receiptUrl,
    appointmentId,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name é obrigatório." });
  }

  if (source && !VALID_SOURCES.includes(source)) {
    return res
      .status(400)
      .json({ error: `source inválido. Use: ${VALID_SOURCES.join(", ")}.` });
  }

  const medication = await prisma.medication.create({
    data: {
      patientId,
      name,
      dosage: dosage ?? null,
      frequency: frequency ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      source: source ?? "MANUAL",
      receiptUrl: receiptUrl ?? null,
      appointmentId: appointmentId ?? null,
    },
  });

  return res.status(201).json(medication);
});

export const getMedication = catchAsync(async (req, res) => {
  const { patientId, medicationId } = req.params;

  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });

  if (!medication) {
    return res.status(404).json({ error: "Medicamento não encontrado." });
  }

  return res.json(medication);
});

export const updateMedication = catchAsync(async (req, res) => {
  const { patientId, medicationId } = req.params;
  const {
    name,
    dosage,
    frequency,
    startDate,
    endDate,
    isActive,
    source,
    receiptUrl,
    appointmentId,
  } = req.body;

  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Medicamento não encontrado." });
  }

  if (source && !VALID_SOURCES.includes(source)) {
    return res
      .status(400)
      .json({ error: `source inválido. Use: ${VALID_SOURCES.join(", ")}.` });
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (dosage !== undefined) data.dosage = dosage;
  if (frequency !== undefined) data.frequency = frequency;
  if (startDate !== undefined)
    data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (source !== undefined) data.source = source;
  if (receiptUrl !== undefined) data.receiptUrl = receiptUrl;
  if (appointmentId !== undefined) data.appointmentId = appointmentId;

  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum campo para atualizar foi enviado." });
  }

  const medication = await prisma.medication.update({
    where: { id: medicationId },
    data,
  });

  return res.json(medication);
});

export const deleteMedication = catchAsync(async (req, res) => {
  const { patientId, medicationId } = req.params;

  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Medicamento não encontrado." });
  }

  await prisma.medication.delete({ where: { id: medicationId } });

  return res.status(204).send();
});
