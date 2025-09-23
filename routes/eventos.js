import express from "express"
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento
} from "../controllers/eventosController.js"

const router = express.Router()

router.get("/", getEventos)             // Obtener todos
router.get("/:id", getEventoById)       // Obtener por ID
router.post("/", createEvento)          // Crear
router.put("/:id", updateEvento)        // Actualizar
router.delete("/:id", deleteEvento)     // Eliminar

export default router
