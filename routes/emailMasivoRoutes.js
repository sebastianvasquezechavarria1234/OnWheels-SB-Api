import { Router } from "express";
import {
  obtenerRolesDisponibles,
  obtenerVistaPreviaDestinatarios,
  enviarCorreosMasivos,
  obtenerHistorialEnviosController,
  eliminarEnvioController,
  enviarIndividualController
} from "../controllers/emailMasivoController.js";

const router = Router();

router.get("/roles-disponibles", obtenerRolesDisponibles);
router.post("/vista-previa", obtenerVistaPreviaDestinatarios);
router.post("/enviar", enviarCorreosMasivos);
router.post("/enviar-individual", enviarIndividualController);
router.get("/historial", obtenerHistorialEnviosController);
router.delete("/:id", eliminarEnvioController);

export default router;