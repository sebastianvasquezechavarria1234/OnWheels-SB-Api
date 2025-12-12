// routes/niveles.js
import express from "express";
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
router.post("/", crearNivel);
router.put("/:id", actualizarNivel);
router.delete("/:id", eliminarNivel);

export default router;