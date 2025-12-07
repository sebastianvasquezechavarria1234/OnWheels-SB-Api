import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from "../controllers/productosController.js";

const router = express.Router();

router.get("/", getProductos); // público
router.get("/:id", getProductoById); // público

router.post("/", authenticateToken, adminOrPermission("gestionar_productos"), createProducto);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_productos"), updateProducto);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_productos"), deleteProducto);

export default router;
