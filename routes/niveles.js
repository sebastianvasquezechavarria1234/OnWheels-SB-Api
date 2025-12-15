// routes/niveles.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  obtenerNiveles,
  obtenerNivelPorId,
  crearNivel,
  actualizarNivel,
  eliminarNivel,
} from "../controllers/nivelesController.js"; // ✅ nombre correcto

const router = express.Router();

router.get("/", obtenerNiveles);
router.get("/:id", obtenerNivelPorId);

router.post("/", authenticateToken, adminOrPermission("gestionar_niveles_clases"), crearNivel);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_niveles_clases"), actualizarNivel);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_niveles_clases"), eliminarNivel);

export default router;