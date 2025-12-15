// routes/administradores.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getAdministradores,
  getAdministradorById,
  createAdministrador,
  updateAdministrador,
  deleteAdministrador,
  getUsuariosSinRol
} from "../controllers/administradoresController.js";

const router = express.Router();

// Listar administradores → solo admin o con "ver_administradores"
router.get(
  "/",
  authenticateToken,
  adminOrPermission("ver_administradores"),
  getAdministradores
);

// Ver un administrador → solo admin o con "ver_administradores"
router.get(
  "/:id",
  authenticateToken,
  adminOrPermission("ver_administradores"),
  getAdministradorById
);

// Crear administrador → solo admin o con "gestionar_administradores"
router.post(
  "/",
  authenticateToken,
  adminOrPermission("gestionar_administradores"),
  createAdministrador
);

// Actualizar administrador → solo admin o con "gestionar_administradores"
router.put(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_administradores"),
  updateAdministrador
);

// Eliminar administrador → solo admin o con "gestionar_administradores"
router.delete(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_administradores"),
  deleteAdministrador
);

// Usuarios sin rol (para asignar como administrador) → solo admin o con "gestionar_administradores"
router.get(
  "/usuarios/disponibles",
  authenticateToken,
  adminOrPermission("gestionar_administradores"),
  getUsuariosSinRol
);

export default router;