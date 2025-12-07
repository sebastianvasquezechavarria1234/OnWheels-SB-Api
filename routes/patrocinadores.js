import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getPatrocinadores,
  getPatrocinadorById,
  createPatrocinador,
  updatePatrocinador,
  deletePatrocinador
} from "../controllers/patrocinadoresController.js";

const router = express.Router();

router.get("/", getPatrocinadores);
router.get("/:id", getPatrocinadorById);

router.post("/", authenticateToken, adminOrPermission("gestionar_patrocinadores"), createPatrocinador);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_patrocinadores"), updatePatrocinador);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_patrocinadores"), deletePatrocinador);

export default router;
