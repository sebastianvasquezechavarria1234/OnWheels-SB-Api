import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { checkOwnershipOrPermission } from "../middleware/checkOwnershipOrPermission.js";
import { getVentas, getVentaById, createVenta, updateVenta, deleteVenta } from "../controllers/ventasController.js";

const router = express.Router();

// Crear venta (cliente autenticado hace la compra)
router.post("/", authenticateToken, createVenta);

// Listar ventas -> admin or ver_ventas
router.get("/", authenticateToken, adminOrPermission("ver_ventas"), getVentas);

// Obtener venta por id -> owner (cliente) o admin/permiso ver_ventas
// Ajustar SQL: obtener id_usuario del cliente asociado a la venta
router.get("/:id",
  authenticateToken,
  checkOwnershipOrPermission({
    sql: `SELECT c.id_usuario FROM ventas v JOIN clientes c ON v.id_cliente = c.id_cliente WHERE v.id_venta = $1`,
    ownerField: "id_usuario",
    permission: "ver_ventas"
  }),
  getVentaById);

// Editar/eliminar -> admin or gestionar_ventas
router.put("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), updateVenta);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_ventas"), deleteVenta);

export default router;
