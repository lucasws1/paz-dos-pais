import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  analyzeDocumentFile,
} from "../controllers/documents.controller.js";

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou PDF.",
        ),
      );
    }
  },
});

router.use(authenticate);

router.get("/", requirePermission(), listDocuments);
router.post(
  "/",
  requirePermission("OWNER", "CAREGIVER"),
  upload.single("file"),
  createDocument,
);
router.post(
  "/analyze",
  requirePermission("OWNER", "CAREGIVER"),
  upload.single("file"),
  analyzeDocumentFile,
);
router.get("/:documentId", requirePermission(), getDocument);
router.put(
  "/:documentId",
  requirePermission("OWNER", "CAREGIVER"),
  updateDocument,
);
router.delete(
  "/:documentId",
  requirePermission("OWNER", "CAREGIVER"),
  deleteDocument,
);

export default router;
