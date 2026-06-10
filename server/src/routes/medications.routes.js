import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listMedications,
  createMedication,
  getMedication,
  updateMedication,
  deleteMedication,
  extractFromReceipt,
} from "../controllers/medications.controller.js";

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error("Tipo de arquivo não permitido. Use: JPEG, PNG ou WebP.");
      err.status = 400;
      cb(err);
    }
  },
});

router.use(authenticate);

router.get("/", requirePermission(), listMedications);
router.post("/", requirePermission("OWNER", "CAREGIVER"), createMedication);
router.post(
  "/extract",
  requirePermission("OWNER", "CAREGIVER"),
  upload.single("file"),
  extractFromReceipt,
);
router.get("/:medicationId", requirePermission(), getMedication);
router.put("/:medicationId", requirePermission("OWNER", "CAREGIVER"), updateMedication);
router.delete("/:medicationId", requirePermission("OWNER", "CAREGIVER"), deleteMedication);

export default router;
