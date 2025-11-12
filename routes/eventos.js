import express from "express";
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento
} from "../controllers/eventosController.js";

const router = express.Router();

router.get("/", getEventos);             // Obtener todos los eventos
router.get("/:id", getEventoById);       // Obtener evento por ID
router.post("/", createEvento);          // Crear evento
router.put("/:id", updateEvento);        // Actualizar evento
router.delete("/:id", deleteEvento);     // Eliminar evento

export default router;
