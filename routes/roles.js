// routes/roles.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
  getPermisosByRol,
  asignarPermisoARol,
  eliminarPermisoDeRol
} from "../controllers/rolesController.js";

const router = express.Router();

// CRUD de roles
router.get("/", authenticateToken, adminOrPermission("ver_roles"), getRoles);
router.get("/:id", authenticateToken, adminOrPermission("ver_roles"), getRolById);
router.post("/", authenticateToken, adminOrPermission("gestionar_roles"), createRol);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_roles"), updateRol);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_roles"), deleteRol);

// Gestión de permisos por rol (¡ESTAS SON LAS QUE FALTABAN!)
router.get("/:id/permisos", authenticateToken, adminOrPermission("ver_roles"), getPermisosByRol);
router.post("/:id/permisos", authenticateToken, adminOrPermission("gestionar_roles"), asignarPermisoARol);
router.delete("/:id/permisos/:idPermiso", authenticateToken, adminOrPermission("gestionar_roles"), eliminarPermisoDeRol);

export default router;