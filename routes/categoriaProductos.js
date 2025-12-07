import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from "../controllers/CategoriaProductosController.js";

const router = express.Router();

router.get("/", getCategorias);
router.get("/:id", getCategoriaById);

router.post("/", authenticateToken, adminOrPermission("gestionar_categorias_productos"), createCategoria);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_categorias_productos"), updateCategoria);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_categorias_productos"), deleteCategoria);

export default router;
