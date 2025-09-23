// routes/compras.js
import express from "express"
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra
} from "../controllers/comprasController.js"

const router = express.Router()

router.get("/", getCompras)            // Todas las compras
router.get("/:id", getCompraById)      // Compra por ID
router.post("/", createCompra)         // Crear compra
router.put("/:id", updateCompra)       // Actualizar compra
router.delete("/:id", deleteCompra)    // Eliminar compra

export default router
