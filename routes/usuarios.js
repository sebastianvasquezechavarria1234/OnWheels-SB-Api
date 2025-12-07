import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
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

// Verificar email (público)
router.get("/verificar-email/:email", verificarEmail);

// Registrar usuario (public) -> si usas register en authRoutes entonces puedes eliminar este POST
router.post("/", createUsuario);

// Lista usuarios -> admin o permiso ver_usuarios
router.get("/", authenticateToken, adminOrPermission("ver_usuarios"), getUsuarios);

// Ver usuario: propietario o admin
router.get("/:id", authenticateToken, async (req, res, next) => {
  if (String(req.params.id) === String(req.user.id_usuario)) return next();
  return adminOrPermission("ver_usuarios")(req, res, next);
}, getUsuarioById);

// Actualizar: propietario o admin
router.put("/:id", authenticateToken, async (req, res, next) => {
  if (String(req.params.id) === String(req.user.id_usuario)) return next();
  return adminOrPermission("gestionar_usuarios")(req, res, next);
}, updateUsuario);

// Eliminar: admin o permiso gestionar_usuarios
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_usuarios"), deleteUsuario);

// Verificar contraseña actual (propio)
router.post("/:id/verify-password", authenticateToken, async (req, res, next) => {
  if (String(req.params.id) === String(req.user.id_usuario)) return next();
  return adminOrPermission("gestionar_usuarios")(req, res, next);
}, verifyPassword);

export default router;
