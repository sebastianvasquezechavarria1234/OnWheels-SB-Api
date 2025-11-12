import express from "express";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from "../controllers/productosController.js";

const router = express.Router();

router.get("/", getProductos);         // Obtener todos los productos
router.get("/:id", getProductoById);   // Obtener un producto por ID
router.post("/", createProducto);      // Crear un producto
router.put("/:id", updateProducto);    // Actualizar un producto
router.delete("/:id", deleteProducto); // Eliminar un producto

export default router;
