import express from "express";
import {
  listarPreinscripciones,
  aceptarPreinscripcion,
  rechazarPreinscripcion
} from "../controllers/preinscripcionController.js";

const router = express.Router();

router.get("/", listarPreinscripciones); // Mostrar todas las preinscripciones pendientes
router.put("/:id/aceptar", aceptarPreinscripcion); // Aceptar preinscripción
router.put("/:id/rechazar", rechazarPreinscripcion); // Rechazar preinscripción

export default router;
