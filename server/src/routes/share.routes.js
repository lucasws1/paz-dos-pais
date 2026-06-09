import { Router } from "express";
import { getSharedPatient } from "../controllers/share.controller.js";

// Rota pública — sem authenticate
const router = Router();

router.get("/:token", getSharedPatient);

export default router;
