import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";
import { uploadFile, deleteFile } from "../services/storage.service.js";
import { analyzeDocument } from "../services/ai.service.js";

const VALID_SOURCES = ["MANUAL", "AI_EXTRACTION"];

export const listDocuments = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { appointmentId } = req.query;

  const where = { patientId };
  if (appointmentId) where.appointmentId = appointmentId;

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return res.json(documents);
});

export const createDocument = catchAsync(async (req, res) => {
  const { patientId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "É obrigatório enviar um arquivo." });
  }

  const { title, aiSummary, source, appointmentId } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title é obrigatório." });
  }

  if (source && !VALID_SOURCES.includes(source)) {
    return res
      .status(400)
      .json({ error: `source inválido. Use: ${VALID_SOURCES.join(", ")}.` });
  }

  const { key, url } = await uploadFile(req.file, `patients/${patientId}`);

  const document = await prisma.document.create({
    data: {
      patientId,
      title,
      fileUrl: url,
      fileKey: key,
      aiSummary: aiSummary ?? null,
      source: source ?? "MANUAL",
      appointmentId: appointmentId ?? null,
    },
  });

  return res.status(201).json(document);
});

/**
 * Analisa um documento via IA e devolve título + resumo sugeridos.
 * NÃO salva nada — o frontend exibe para revisão antes do upload definitivo.
 */
export const analyzeDocumentFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "É obrigatório enviar um arquivo." });
  }

  const { title, summary } = await analyzeDocument(
    req.file.buffer,
    req.file.mimetype,
  );

  return res.json({ title, aiSummary: summary });
});

export const getDocument = catchAsync(async (req, res) => {
  const { patientId, documentId } = req.params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, patientId },
  });

  if (!document) {
    return res.status(404).json({ error: "Documento não encontrado." });
  }

  return res.json(document);
});

export const updateDocument = catchAsync(async (req, res) => {
  const { patientId, documentId } = req.params;
  const { title, aiSummary, source, appointmentId } = req.body;

  const existing = await prisma.document.findFirst({
    where: { id: documentId, patientId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Documento não encontrado." });
  }

  if (source && !VALID_SOURCES.includes(source)) {
    return res
      .status(400)
      .json({ error: `source inválido. Use: ${VALID_SOURCES.join(", ")}.` });
  }

  const data = {};
  if (title !== undefined) data.title = title;
  if (aiSummary !== undefined) data.aiSummary = aiSummary;
  if (source !== undefined) data.source = source;
  if (appointmentId !== undefined) data.appointmentId = appointmentId;

  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum campo para atualizar foi enviado." });
  }

  const document = await prisma.document.update({
    where: { id: documentId },
    data,
  });

  return res.json(document);
});

export const deleteDocument = catchAsync(async (req, res) => {
  const { patientId, documentId } = req.params;

  const existing = await prisma.document.findFirst({
    where: { id: documentId, patientId },
  });

  if (!existing) {
    return res.status(404).json({ error: "Documento não encontrado." });
  }

  // Deleta do banco e do R2 em paralelo
  await Promise.all([
    prisma.document.delete({ where: { id: documentId } }),
    deleteFile(existing.fileKey),
  ]);

  return res.status(204).send();
});
