import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { listarTallas, crearTalla, actualizarTalla, eliminarTalla } from "../controllers/tallasController.js";

const router = express.Router();

router.get("/", listarTallas);
router.post("/", authenticateToken, adminOrPermission("gestionar_tallas"), crearTalla);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_tallas"), actualizarTalla);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_tallas"), eliminarTalla);

export default router;
