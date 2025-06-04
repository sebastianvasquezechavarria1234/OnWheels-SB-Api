import express from "express"
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
} from "../controllers/eventosController.js"

const router = express.Router()

// Rutas simples sin parámetros complejos
router.get("/", getEventos)
router.get("/:id", getEventoById)
router.post("/", createEvento)
router.put("/:id", updateEvento)
router.delete("/:id", deleteEvento)

export default router
