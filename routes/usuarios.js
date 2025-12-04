import express from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  verificarEmail
} from "../controllers/usuariosController.js";

const router = express.Router();

// Nota: colocar rutas concretas /verificar-email antes de /:id para evitar conflictos
router.get("/", getUsuarios);
router.get("/verificar-email/:email", verificarEmail);
router.get("/:id", getUsuarioById);

router.post("/", createUsuario);
router.put("/:id", updateUsuario);
router.delete("/:id", deleteUsuario);

export default router;