import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from "../controllers/proveedoresController.js";

const router = express.Router();

router.get("/", authenticateToken, adminOrPermission("ver_proveedores"), getProveedores);
router.get("/:nit", authenticateToken, adminOrPermission("ver_proveedores"), getProveedorById);

router.post("/", authenticateToken, adminOrPermission("gestionar_proveedores"), createProveedor);
router.put("/:nit", authenticateToken, adminOrPermission("gestionar_proveedores"), updateProveedor);
router.delete("/:nit", authenticateToken, adminOrPermission("gestionar_proveedores"), deleteProveedor);

export default router;
