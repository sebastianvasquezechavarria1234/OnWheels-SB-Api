import express from "express";
import {
  registrarPreinscripcion,
  listarPreinscripcionesPendientes,
  cambiarEstadoPreinscripcion
} from "../controllers/preinscripcionesController.js";

const router = express.Router();

// Registrar preinscripción
router.post("/", registrarPreinscripcion);

// Ver todas las preinscripciones pendientes
router.get("/", listarPreinscripcionesPendientes);

// Cambiar estado: /preinscripciones/10  { estado: "aceptado" }
router.put("/:id", cambiarEstadoPreinscripcion);

export default router;
