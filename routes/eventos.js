// routes/eventos.routes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  getEventosPorCategoria,
  getEventosFuturos
} from "../controllers/eventosController.js";

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (NO requieren login)
// ============================================

// Obtener todos los eventos
router.get("/", getEventos);

// Obtener eventos futuros
router.get("/futuros", getEventosFuturos);

// Obtener eventos por categoría
router.get("/categoria/:categoriaId", getEventosPorCategoria);

// Obtener evento por ID
router.get("/:id", getEventoById);


// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Crear evento → requiere "gestionar_eventos"
router.post(
  "/",
  authenticateToken,
  adminOrPermission("gestionar_eventos"),
  createEvento
);

// Actualizar evento → requiere "gestionar_eventos"
router.put(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_eventos"),
  updateEvento
);

// Eliminar evento → requiere "gestionar_eventos"
router.delete(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_eventos"),
  deleteEvento
);

export default router;
