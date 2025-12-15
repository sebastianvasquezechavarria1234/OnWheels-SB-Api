import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  crear,
  listar,
   obtenerPorId,
    actualizar,
     eliminar } from "../controllers/estudiantesController.js"

const router = express.Router()

// crear preinscripción / estudiante: admin o permiso (si registro por admin)
router.post("/", authenticateToken, adminOrPermission("gestionar_estudiantes"), crear);

// listar/ver - admin o permiso ver_estudiantes
router.get("/", authenticateToken, adminOrPermission("ver_estudiantes"), listar);
router.get("/:id", authenticateToken, adminOrPermission("ver_estudiantes"), obtenerPorId);

// actualizar/eliminar
router.put("/:id", authenticateToken, adminOrPermission("gestionar_estudiantes"), actualizar);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_estudiantes"), eliminar);

export default router;
