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
  verifyPassword,
  getUsuariosElegiblesParaEstudiante,
  getUsuariosSinCliente,
  getUsuariosSoloConRolCliente,
  updatePerfil,
  uploadProfileImage
} from "../controllers/usuariosController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// === 🟢 RUTAS PÚBLICAS (sin autenticación) ===
router.get("/verificar-email/:email", verificarEmail);
router.get("/elegibles-para-estudiante", getUsuariosElegiblesParaEstudiante);
router.get("/sin-cliente", getUsuariosSinCliente);
router.get("/rol/solo-cliente", getUsuariosSoloConRolCliente); // ← Nueva ruta pública
router.post("/", createUsuario); // Registro público

// === 🔒 RUTAS PROTEGIDAS (con auth y permisos) ===

// Perfil Usuario (Autogestión)
router.put("/perfil", authenticateToken, updatePerfil);

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

// Subir/Actualizar foto de perfil -> si es propio -> ok; si no -> requiere "gestionar_usuarios"
router.post(
  "/:id/foto",
  authenticateToken,
  async (req, res, next) => {
    if (String(req.params.id) === String(req.user.id_usuario)) {
      return next();
    }
    return adminOrPermission("gestionar_usuarios")(req, res, next);
  },
  upload.single("foto_perfil"),
  uploadProfileImage
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