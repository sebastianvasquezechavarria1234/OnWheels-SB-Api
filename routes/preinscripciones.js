// routes/preinscripcionesRoutes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  crearPreinscripcionCtrl,
  listarPreinscripcionesPendientes,
  obtenerPreinscripcionPorId,
  rechazarPreinscripcion,
  aceptarPreinscripcionYCrearMatricula,
} from "../controllers/preinscripcionesController.js";

const router = express.Router();

// cualquier usuario autenticado puede crear preinscripcion
router.post("/", authenticateToken, crearPreinscripcionCtrl);

// listar/ver -> admin o permiso ver_preinscripciones
router.get("/", authenticateToken, adminOrPermission("ver_preinscripciones"), listarPreinscripcionesPendientes);
router.get("/:id", authenticateToken, adminOrPermission("ver_preinscripciones"), obtenerPreinscripcionPorId);

// aprobar/rechazar -> admin or gestionar_preinscripciones
// Aprobar preinscripción (aceptar → crear matrícula)
router.post("/:id/aceptar", authenticateToken, adminOrPermission("gestionar_preinscripciones"), aceptarPreinscripcionYCrearMatricula);

// Rechazar preinscripción
router.post("/:id/rechazar", authenticateToken, adminOrPermission("gestionar_preinscripciones"), rechazarPreinscripcion);

export default router;
