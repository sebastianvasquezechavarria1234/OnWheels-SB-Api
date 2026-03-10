import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { checkOwnershipOrPermission } from "../middleware/checkOwnershipOrPermission.js";
import { getVentas, getVentaById, createVenta, updateVenta, deleteVenta, cancelVenta, getMisCompras, updateVentaStatus } from "../controllers/ventasController.js";

const router = express.Router();

// ... existing routes ...
router.get("/mis-compras", authenticateToken, getMisCompras);

// Listar todas (admin/gestor)
router.get("/", authenticateToken, adminOrPermission("gestionar_ventas"), getVentas);

// Ver detalle (admin/gestor o dueño de la compra)
router.get("/:id", authenticateToken, checkOwnershipOrPermission({
    sql: "SELECT c.id_usuario FROM ventas v JOIN clientes c ON v.id_cliente = c.id_cliente WHERE v.id_venta = $1",
    ownerField: "id_usuario",
    permission: "gestionar_ventas"
}), getVentaById);

// Crear nueva venta
router.post("/", authenticateToken, adminOrPermission("gestionar_ventas"), createVenta);

// Editar/eliminar -> admin or gestionar_ventas
router.put("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), updateVenta);
router.put("/:id/status", authenticateToken, adminOrPermission("gestionar_ventas"), updateVentaStatus);
router.put("/:id/cancel", authenticateToken, adminOrPermission("gestionar_ventas"), cancelVenta);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), deleteVenta);

export default router;
