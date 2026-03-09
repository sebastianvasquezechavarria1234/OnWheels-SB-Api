import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { getPedidos, getPedidoById } from "../controllers/pedidosController.js";
import { createVenta, updateVenta, deleteVenta, updateVentaStatus, cancelVenta } from "../controllers/ventasController.js";

const router = express.Router();

// Listar pedidos (admin/gestor) - Solo Pendientes
router.get("/", authenticateToken, adminOrPermission("gestionar_ventas"), getPedidos);

// Ver detalle de pedido (admin/gestor) - Solo si Pendiente
router.get("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), getPedidoById);

// Crear nuevo pedido (es internamente una venta inicializada como 'Pendiente')
router.post("/", authenticateToken, adminOrPermission("gestionar_ventas"), createVenta);

// Editar pedido (la validación interna de ventasController verifica que sea 'Pendiente')
router.put("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), updateVenta);

// Actualizar estado del pedido (a Pagado, Entregada, Procesada, etc.)
router.put("/:id/status", authenticateToken, adminOrPermission("gestionar_ventas"), updateVentaStatus);

// Cancelar un pedido
router.put("/:id/cancel", authenticateToken, adminOrPermission("gestionar_ventas"), cancelVenta);

// Eliminar pedido (la validación interna de ventasController verifica que sea 'Pendiente')
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), deleteVenta);

export default router;
