import express from "express"
import {
  getColores,
  getColorById,
  createColor,
  updateColor,
  deleteColor
} from "../controllers/coloresController.js"

const router = express.Router()

router.get("/", getColores)        // Listar todos los colores
router.get("/:id", getColorById)   // Obtener un color por ID
router.post("/", createColor)      // Crear color
router.put("/:id", updateColor)    // Actualizar color
router.delete("/:id", deleteColor) // Eliminar color

export default router
