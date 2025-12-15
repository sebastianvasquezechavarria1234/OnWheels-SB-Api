import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
} from "../controllers/comprasController.js";

const router = express.Router();

// Listar compras (admin/permiso)
router.get("/", authenticateToken, adminOrPermission("ver_compras"), getCompras);

// Obtener compra por id (admin/permiso)
router.get("/:id", authenticateToken, adminOrPermission("ver_compras"), getCompraById);

// Crear/Actualizar/Eliminar -> gestionar_compras
router.post("/", authenticateToken, adminOrPermission("gestionar_compras"), createCompra);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_compras"), updateCompra);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_compras"), deleteCompra);

export default router;
