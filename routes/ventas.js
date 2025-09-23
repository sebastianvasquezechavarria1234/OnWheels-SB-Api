import express from "express"
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta
} from "../controllers/ventasController.js"

const router = express.Router()

// GET /api/ventas - Obtener todas las ventas
router.get("/", getVentas)

// GET /api/ventas/:id - Obtener venta por ID
router.get("/:id", getVentaById)

// POST /api/ventas - Crear nueva venta
router.post("/", createVenta)

// PUT /api/ventas/:id - Actualizar venta
router.put("/:id", updateVenta)

// DELETE /api/ventas/:id - Eliminar venta
router.delete("/:id", deleteVenta)

export default router
