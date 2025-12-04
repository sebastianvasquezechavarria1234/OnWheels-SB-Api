import express from "express";
import {
  crearPreinscripcionCtrl,
  listarPreinscripcionesPendientes,
  obtenerPreinscripcionPorId,
  actualizarEstadoPreinscripcionCtrl
} from "../controllers/preinscripcionesController.js";

const router = express.Router();

// CRUD de preinscripciones
router.post("/", crearPreinscripcionCtrl);          
router.get("/", listarPreinscripcionesPendientes);           
router.get("/:id", obtenerPreinscripcionPorId); 
router.put("/:id/estado", actualizarEstadoPreinscripcionCtrl);    

export default router;