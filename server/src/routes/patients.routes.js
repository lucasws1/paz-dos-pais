import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patients.controller.js";
import { createShareToken } from "../controllers/share.controller.js";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

router.get("/", listPatients);
router.post("/", createPatient);
router.get("/:patientId", requirePermission(), getPatient);
router.put(
  "/:patientId",
  requirePermission("OWNER", "CAREGIVER"),
  updatePatient,
);
router.delete("/:patientId", requirePermission("OWNER"), deletePatient);
router.post("/:patientId/share", requirePermission("OWNER"), createShareToken);

export default router;
