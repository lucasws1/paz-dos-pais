import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";
import { uploadFile } from "../services/storage.service.js";
import { extractMedicationsFromImage } from "../services/ai.service.js";

const VALID_SOURCES = ["MANUAL", "AI_EXTRACTION"];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseTimes(times) {
  return String(times)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function isValidTimes(times) {
  const parsed = parseTimes(times);
  return parsed.length > 0 && parsed.every((t) => TIME_REGEX.test(t));
}

function normalizeTimes(times) {
  return parseTimes(times).sort().join(",");
}

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
    times,
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

  if (times && !isValidTimes(times)) {
    return res
      .status(400)
      .json({
        error:
          'times inválido. Use horários HH:mm separados por vírgula, ex: "08:00,20:00".',
      });
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
      times: times ? normalizeTimes(times) : null,
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
    times,
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

  if (times && !isValidTimes(times)) {
    return res
      .status(400)
      .json({
        error:
          'times inválido. Use horários HH:mm separados por vírgula, ex: "08:00,20:00".',
      });
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (dosage !== undefined) data.dosage = dosage;
  if (frequency !== undefined) data.frequency = frequency;
  if (times !== undefined) data.times = times ? normalizeTimes(times) : null;
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

/**
 * Extrai medicamentos de uma foto de receita via IA. NÃO salva nada no banco —
 * devolve os candidatos para revisão humana no frontend (e a URL da receita
 * já enviada ao storage, para vincular aos medicamentos confirmados).
 */
export const extractFromReceipt = catchAsync(async (req, res) => {
  const { patientId } = req.params;

  if (!req.file) {
    return res
      .status(400)
      .json({ error: "É obrigatório enviar a foto da receita." });
  }

  const { medications } = await extractMedicationsFromImage(
    req.file.buffer,
    req.file.mimetype,
  );
  const { url: receiptUrl } = await uploadFile(
    req.file,
    `patients/${patientId}/receipts`,
  );

  return res.json({ receiptUrl, medications });
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
