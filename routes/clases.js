import express from "express"
import { getClases, getClaseById, createClase, updateClase, deleteClase } from "../controllers/clasesController.js"

const router = express.Router()

// GET /api/clases - Obtener todas las clases
router.get("/", getClases)

// GET /api/clases/:id - Obtener una clase por ID
router.get("/:id", getClaseById)

// POST /api/clases - Crear una nueva clase
router.post("/", createClase)

// PUT /api/clases/:id - Actualizar una clase
router.put("/:id", updateClase)

// DELETE /api/clases/:id - Eliminar una clase
router.delete("/:id", deleteClase)

export default router
