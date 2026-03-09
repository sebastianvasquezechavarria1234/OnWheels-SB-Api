import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { checkOwnershipOrPermission } from "../middleware/checkOwnershipOrPermission.js";
import { getVentas, getVentaById, createVenta, updateVenta, deleteVenta, cancelVenta, getMisCompras, updateVentaStatus } from "../controllers/ventasController.js";

const router = express.Router();

// Obtener todas las ventas (Admin o permiso)
router.get("/", authenticateToken, adminOrPermission("ver_ventas"), getVentas);

// Obtener mis compras (Usuario logueado)
router.get("/mis-compras", authenticateToken, getMisCompras);

// Obtener detalles de una venta (Dueño o permiso)
router.get("/:id", authenticateToken, checkOwnershipOrPermission({
    sql: "SELECT c.id_usuario FROM ventas v JOIN clientes c ON v.id_cliente = c.id_cliente WHERE v.id_venta = $1",
    ownerField: "id_usuario",
    permission: "ver_ventas"
}), getVentaById);

// Crear nueva venta (Cualquier usuario autenticado puede comprar)
router.post("/", authenticateToken, createVenta);

// Editar/eliminar -> solo admin or gestionar_ventas
router.put("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), updateVenta);
router.put("/:id/status", authenticateToken, adminOrPermission("gestionar_ventas"), updateVentaStatus);
router.put("/:id/cancel", authenticateToken, adminOrPermission("gestionar_ventas"), cancelVenta);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), deleteVenta);

export default router;
