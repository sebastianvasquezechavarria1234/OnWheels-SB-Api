import express from "express"
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
} from "../controllers/productosController.js"

const router = express.Router()

// GET /api/productos - Obtener todos los productos (con filtro opcional por categoría)
router.get("/", getProductos)

// GET /api/productos/:id - Obtener un producto por ID
router.get("/:id", getProductoById)

// POST /api/productos - Crear un nuevo producto
router.post("/", createProducto)

// PUT /api/productos/:id - Actualizar un producto
router.put("/:id", updateProducto)

// DELETE /api/productos/:id - Eliminar un producto
router.delete("/:id", deleteProducto)

export default router
