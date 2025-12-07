import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede
} from "../controllers/sedesController.js";

const router = express.Router();

router.get("/", getSedes);
router.get("/:id", getSedeById);

router.post("/", authenticateToken, adminOrPermission("gestionar_sedes"), createSede);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_sedes"), updateSede);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_sedes"), deleteSede);

export default router;
