import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listMedications,
  createMedication,
  getMedication,
  updateMedication,
  deleteMedication,
} from "../controllers/medications.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requirePermission(), listMedications);
router.post("/", requirePermission("OWNER", "CAREGIVER"), createMedication);
router.get("/:medicationId", requirePermission(), getMedication);
router.put("/:medicationId", requirePermission("OWNER", "CAREGIVER"), updateMedication);
router.delete("/:medicationId", requirePermission("OWNER", "CAREGIVER"), deleteMedication);

export default router;
