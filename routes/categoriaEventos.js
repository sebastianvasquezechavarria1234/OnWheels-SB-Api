import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from "../controllers/categoriasController.js";

const router = express.Router();

router.get("/", getCategorias); // público
router.get("/:id", getCategoriaById); // público

router.post("/", authenticateToken, adminOrPermission("gestionar_categoria_eventos"), createCategoria);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_categoria_eventos"), updateCategoria);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_categoria_eventos"), deleteCategoria);

export default router;
