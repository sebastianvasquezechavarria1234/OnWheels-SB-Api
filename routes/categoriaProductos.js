import express from "express"
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from "../controllers/CategoriaProductosController.js"

const router = express.Router()

router.get("/", getCategorias)          // Todas las categorías
router.get("/:id", getCategoriaById)    // Categoría por ID
router.post("/", createCategoria)       // Crear
router.put("/:id", updateCategoria)     // Actualizar
router.delete("/:id", deleteCategoria)  // Eliminar

export default router
