import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import patientsRoutes from "./routes/patients.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";
import medicationsRoutes from "./routes/medications.routes.js";
import medicationLogsRoutes from "./routes/medicationLogs.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import shareRoutes from "./routes/share.routes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/patients", patientsRoutes);
app.use("/patients/:patientId/appointments", appointmentsRoutes);
app.use("/patients/:patientId/medications", medicationsRoutes);
app.use("/patients/:patientId/medication-logs", medicationLogsRoutes);
app.use("/patients/:patientId/documents", documentsRoutes);
app.use("/share", shareRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status ?? err.statusCode ?? 500;
  const message = status < 500 ? err.message : "Erro interno do servidor.";
  res.status(status).json({ error: message });
});

export default app;
