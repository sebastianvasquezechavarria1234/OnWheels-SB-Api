import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getAcudientes,
  getAcudienteById,
  createAcudiente,
  updateAcudiente,
  deleteAcudiente
} from "../controllers/acudientesController.js";

const router = express.Router();

// público: listar y obtener (si quieres privado, cambia)
router.get("/", authenticateToken, adminOrPermission("ver_acudientes"), getAcudientes);
router.get("/:id", authenticateToken, adminOrPermission("ver_acudientes"), getAcudienteById);

// crear/editar/eliminar -> admin o permiso gestionar_acudientes
router.post("/", authenticateToken, adminOrPermission("gestionar_acudientes"), createAcudiente);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_acudientes"), updateAcudiente);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_acudientes"), deleteAcudiente);

export default router;
