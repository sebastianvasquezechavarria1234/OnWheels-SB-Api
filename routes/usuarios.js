// usuarioRoutes.js
import express from "express";
import {
  getUsuarios,
  getUsuarioById,
  verificarEmail,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuariosElegiblesParaEstudiante, // ← Asegúrate de importarla
  getUsuariosSinCliente  // ← Asegúrate de importarla
} from "../controllers/usuariosController.js";

const router = express.Router();

// Rutas sin parámetros → van primero
router.get("/", getUsuarios);
router.get("/elegibles-para-estudiante", getUsuariosElegiblesParaEstudiante);
router.get("/verificar-email/:email", verificarEmail);
router.get("/sin-cliente", getUsuariosSinCliente);

// Rutas con parámetros → van al final
router.get("/:id", getUsuarioById);
router.post("/", createUsuario);
router.put("/:id", updateUsuario);
router.delete("/:id", deleteUsuario);

export default router;