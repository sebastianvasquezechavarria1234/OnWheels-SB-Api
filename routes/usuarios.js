
import express from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  verificarEmail,
  verifyPassword
} from "../controllers/usuariosController.js";

const router = express.Router();

// Rutas públicas/colección
router.get("/", getUsuarios);
router.get("/verificar-email/:email", verificarEmail);

// Verificar contraseña actual (validación en tiempo real)
router.post("/:id/verify-password", verifyPassword);

// Rutas por id (colocar despues de rutas concretas para evitar conflictos)
router.get("/:id", getUsuarioById);

router.post("/", createUsuario);
router.put("/:id", updateUsuario);
router.delete("/:id", deleteUsuario);

export default router;
