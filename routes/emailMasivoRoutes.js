// routes/emailMasivoRoutes.js
import express from "express";
import {
  getRolesConUsuarios,
  getUsuariosPorRol,
  enviarCorreoPorRoles,
  getHistorialEnvios,
  getDetalleEnvio
} from "../controllers/emailMasivoControllerjs";

const router = express.Router();

// Obtener roles con cantidad de usuarios
router.get("/roles", getRolesConUsuarios);

// Obtener usuarios específicos por rol
router.get("/usuarios-por-rol", getUsuariosPorRol);

// Enviar correo masivo por roles
router.post("/enviar-por-roles", enviarCorreoPorRoles);

// Historial y detalles
router.get("/historial", getHistorialEnvios);
router.get("/historial/:id", getDetalleEnvio);

export default router;