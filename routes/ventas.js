import express from "express";
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta
} from "../controllers/ventasController.js";

const router = express.Router();

router.get("/", getVentas);          // Obtener todas las ventas
router.get("/:id", getVentaById);    // Obtener venta por ID
router.post("/", createVenta);       // Crear venta
router.put("/:id", updateVenta);     // Actualizar venta
router.delete("/:id", deleteVenta);  // Eliminar venta

export default router;
