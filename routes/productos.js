import express from "express";
import { listarProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto } from "../controllers/productosController.js";

const router = express.Router();

router.get("/", listarProductos);
router.get("/:id", obtenerProducto);
router.post("/", crearProducto);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

export default router;
