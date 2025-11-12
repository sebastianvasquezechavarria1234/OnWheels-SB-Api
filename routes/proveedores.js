import express from "express";
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from "../controllers/proveedoresController.js";

const router = express.Router();

router.get("/", getProveedores);           // Obtener todos los proveedores
router.get("/:nit", getProveedorById);     // Obtener proveedor por NIT
router.post("/", createProveedor);         // Crear proveedor
router.put("/:nit", updateProveedor);      // Actualizar proveedor
router.delete("/:nit", deleteProveedor);   // Eliminar proveedor

export default router;
