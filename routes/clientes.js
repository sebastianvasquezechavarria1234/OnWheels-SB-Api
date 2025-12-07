import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} from "../controllers/clienteController.js";

const router = Router();

// Crear cliente: admin o gestionar_clientes (si clientes los administra admin)
// Si clientes son usuarios que se registran por auth, este POST puede no usarse.
router.post("/", createCliente);

// Listar y ver: admin/permiso
router.get("/", authenticateToken, adminOrPermission("ver_clientes"), getClientes);
router.get("/:id", authenticateToken, adminOrPermission("ver_clientes"), getClienteById);

// actualizar/eliminar -> admin/permiso
router.put("/:id", authenticateToken, adminOrPermission("gestionar_clientes"), updateCliente);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_clientes"), deleteCliente);

export default router;
