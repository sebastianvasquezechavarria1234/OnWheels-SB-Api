// routes/matriculaRoutes.js
import express from "express";
import {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
  crearMatriculaManual
} from "../controllers/matriculasController.js";

const router = express.Router();

// Rutas existentes
router.post("/", crear);
router.get("/", listar);
router.get("/:id", obtenerPorId);
router.put("/:id", actualizar);
router.delete("/:id", eliminar);

// Nueva ruta
router.post("/manual", crearMatriculaManual);

export default router;