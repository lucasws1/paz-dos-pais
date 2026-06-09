import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import {
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documents.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requirePermission(), listDocuments);
router.post("/", requirePermission("OWNER", "CAREGIVER"), createDocument);
router.get("/:documentId", requirePermission(), getDocument);
router.put("/:documentId", requirePermission("OWNER", "CAREGIVER"), updateDocument);
router.delete("/:documentId", requirePermission("OWNER", "CAREGIVER"), deleteDocument);

export default router;
