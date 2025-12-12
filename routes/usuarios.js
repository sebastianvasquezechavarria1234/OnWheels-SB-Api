// usuarioRoutes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getUsuarios,
  getUsuarioById,
  verificarEmail,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  verifyPassword, // ← ¡IMPORTANTE! Asegúrate de exportarla en el controller
  getUsuariosElegiblesParaEstudiante,
  getUsuariosSinCliente
} from "../controllers/usuariosController.js";

const router = express.Router();

// === RUTAS PÚBLICAS (sin autenticación) ===
router.get("/verificar-email/:email", verificarEmail);
router.get("/elegibles-para-estudiante", getUsuariosElegiblesParaEstudiante);
router.get("/sin-cliente", getUsuariosSinCliente);
router.post("/", createUsuario); // Registro público

// === RUTAS PROTEGIDAS ===

// Listar usuarios → solo admin o con "ver_usuarios"
router.get(
  "/",
  authenticateToken,
  adminOrPermission("ver_usuarios"),
  getUsuarios
);

// Ver usuario → si es propio → ok; si no → requiere "ver_usuarios"
router.get(
  "/:id",
  authenticateToken,
  async (req, res, next) => {
    if (String(req.params.id) === String(req.user.id_usuario)) {
      return next(); // Acceso propio → permitido
    }
    return adminOrPermission("ver_usuarios")(req, res, next);
  },
  getUsuarioById
);

// Actualizar usuario → si es propio → ok; si no → requiere "gestionar_usuarios"
router.put(
  "/:id",
  authenticateToken,
  async (req, res, next) => {
    if (String(req.params.id) === String(req.user.id_usuario)) {
      return next();
    }
    return adminOrPermission("gestionar_usuarios")(req, res, next);
  },
  updateUsuario
);

// Eliminar usuario → solo admin o con "gestionar_usuarios"
router.delete(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_usuarios"),
  deleteUsuario
);

// Verificar contraseña → solo para el mismo usuario (o admin)
router.post(
  "/:id/verify-password",
  authenticateToken,
  async (req, res, next) => {
    if (String(req.params.id) === String(req.user.id_usuario)) {
      return next();
    }
    return adminOrPermission("gestionar_usuarios")(req, res, next);
  },
  verifyPassword
);

export default router;