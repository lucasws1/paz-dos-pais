import prisma from "../lib/prisma.js";

export async function listPatients(req, res) {
  const permissions = await prisma.permission.findMany({
    where: { userId: req.user.id },
    include: { patient: true },
    orderBy: { patient: { name: "asc" } },
  });

  const patients = permissions.map(({ patient, role }) => ({ ...patient, role }));

  return res.json(patients);
}

export async function createPatient(req, res) {
  const { name, birthDate, allergies, alerts, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name é obrigatório." });
  }

  const patient = await prisma.$transaction(async (tx) => {
    const newPatient = await tx.patient.create({
      data: {
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        allergies: allergies ?? null,
        alerts: alerts ?? null,
        notes: notes ?? null,
      },
    });

    await tx.permission.create({
      data: { userId: req.user.id, patientId: newPatient.id, role: "OWNER" },
    });

    return newPatient;
  });

  return res.status(201).json(patient);
}

export async function getPatient(req, res) {
  const { patientId } = req.params;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });

  if (!patient) {
    return res.status(404).json({ error: "Paciente não encontrado." });
  }

  return res.json({ ...patient, role: req.permission.role });
}

export async function updatePatient(req, res) {
  const { patientId } = req.params;
  const { name, birthDate, allergies, alerts, notes } = req.body;

  const data = {};
  if (name !== undefined) data.name = name;
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
  if (allergies !== undefined) data.allergies = allergies;
  if (alerts !== undefined) data.alerts = alerts;
  if (notes !== undefined) data.notes = notes;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar foi enviado." });
  }

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data,
  });

  return res.json(patient);
}

export async function deletePatient(req, res) {
  const { patientId } = req.params;

  await prisma.patient.delete({ where: { id: patientId } });

  return res.status(204).send();
}
