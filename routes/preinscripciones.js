// routes/preinscripcionesRoutes.js
import express from "express";
import {
  crearPreinscripcionCtrl,
  listarPreinscripcionesPendientes,
  obtenerPreinscripcionPorId,
  rechazarPreinscripcion,
  aceptarPreinscripcionYCrearMatricula,
} from "../controllers/preinscripcionesController.js";

const router = express.Router();

// Crear nueva preinscripción
router.post("/", crearPreinscripcionCtrl);

// Listar todas las preinscripciones pendientes (dashboard)
router.get("/", listarPreinscripcionesPendientes);

// Obtener detalle de una preinscripción
router.get("/:id", obtenerPreinscripcionPorId);

// Rechazar una preinscripción
router.put("/:id/rechazar", rechazarPreinscripcion);

// Aceptar una preinscripción y crear matrícula
router.post("/:id/aceptar", aceptarPreinscripcionYCrearMatricula);

export default router;