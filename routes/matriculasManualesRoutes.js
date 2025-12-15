// routes/matriculasManuales.routes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { crearMatriculaManual } from "../controllers/matriculasManualesController.js";

const router = express.Router();

// Crear matrícula manual (nuevo estudiante + matrícula) → solo admin o con "gestionar_matriculas"
router.post(
  "/",
  authenticateToken,
  adminOrPermission("gestionar_matriculas"),
  crearMatriculaManual
);

export default router;