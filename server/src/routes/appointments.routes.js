import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointments.controller.js";

// mergeParams: true para herdar :patientId do roteador pai
const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requirePermission(), listAppointments);
router.post("/", requirePermission("OWNER", "CAREGIVER"), createAppointment);
router.get("/:appointmentId", requirePermission(), getAppointment);
router.put("/:appointmentId", requirePermission("OWNER", "CAREGIVER"), updateAppointment);
router.delete("/:appointmentId", requirePermission("OWNER", "CAREGIVER"), deleteAppointment);

export default router;
