import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";

const DEFAULT_EXPIRY_HOURS = 24;

export const createShareToken = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { expiresInHours } = req.body;

  const hours = Number(expiresInHours) || DEFAULT_EXPIRY_HOURS;
  if (hours <= 0 || hours > 720) {
    return res
      .status(400)
      .json({ error: "expiresInHours deve ser entre 1 e 720." });
  }

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const shareToken = await prisma.shareToken.create({
    data: { patientId, expiresAt },
    select: { token: true, expiresAt: true, createdAt: true },
  });

  return res.status(201).json(shareToken);
});

export const getSharedPatient = catchAsync(async (req, res) => {
  const { token } = req.params;

  const shareToken = await prisma.shareToken.findUnique({
    where: { token },
  });

  if (!shareToken) {
    return res.status(404).json({ error: "Link inválido ou inexistente." });
  }

  if (new Date() > shareToken.expiresAt) {
    return res.status(410).json({ error: "Este link expirou." });
  }

  // Incrementa contador e busca dados do paciente em paralelo
  const [patient, medications, documents] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: shareToken.patientId },
      select: { name: true, birthDate: true, allergies: true, alerts: true },
    }),
    prisma.medication.findMany({
      where: { patientId: shareToken.patientId, isActive: true },
      select: { name: true, dosage: true, frequency: true, startDate: true },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { patientId: shareToken.patientId },
      select: { title: true, fileUrl: true, aiSummary: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.shareToken.update({
      where: { token },
      data: { accessCount: { increment: 1 } },
    }),
  ]);

  if (!patient) {
    return res.status(404).json({ error: "Paciente não encontrado." });
  }

  return res.json({ patient, medications, documents });
});
