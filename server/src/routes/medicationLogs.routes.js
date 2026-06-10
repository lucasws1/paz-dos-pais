import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
} from "../controllers/medicationLogs.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requirePermission(), listMedicationLogs);
router.post("/", requirePermission("OWNER", "CAREGIVER"), createMedicationLog);
router.put("/:logId", requirePermission("OWNER", "CAREGIVER"), updateMedicationLog);
router.delete("/:logId", requirePermission("OWNER", "CAREGIVER"), deleteMedicationLog);

export default router;
