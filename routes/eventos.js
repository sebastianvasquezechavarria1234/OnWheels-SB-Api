import express from "express";
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
// RUTAS PARA EVENTOS
// ============================================

router.get("/", getEventos);
router.get("/futuros", getEventosFuturos);
router.get("/categoria/:categoriaId", getEventosPorCategoria);
router.get("/:id", getEventoById);
router.post("/", createEvento);
router.put("/:id", updateEvento);
router.delete("/:id", deleteEvento);

export default router;
