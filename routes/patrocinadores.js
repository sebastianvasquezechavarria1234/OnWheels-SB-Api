import express from "express"
import {
  getPatrocinadores,
  getPatrocinadorById,
  createPatrocinador,
  updatePatrocinador,
  deletePatrocinador
} from "../controllers/patrocinadoresController.js"

const router = express.Router()

router.get("/", getPatrocinadores)             // Obtener todos
router.get("/:id", getPatrocinadorById)        // Obtener por ID
router.post("/", createPatrocinador)           // Crear
router.put("/:id", updatePatrocinador)         // Actualizar
router.delete("/:id", deletePatrocinador)      // Eliminar

export default router
