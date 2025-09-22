import express from "express"
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from "../controllers/proveedoresController.js"

const router = express.Router()

router.get("/", getProveedores)             // Obtener todos
router.get("/:nit", getProveedorById)       // Obtener por NIT
router.post("/", createProveedor)           // Crear
router.put("/:nit", updateProveedor)        // Actualizar
router.delete("/:nit", deleteProveedor)     // Eliminar

export default router
