// routes/rolesPermisos.routes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getRolesPermisos,
  asignarPermisoARol,
  eliminarPermisoDeRol
} from "../controllers/rolesPermisosController.js";

const router = express.Router();

// Proteger con "gestionar_roles" (permiso que SÍ existe)
router.get("/", authenticateToken, adminOrPermission("gestionar_roles"), getRolesPermisos);
router.post("/", authenticateToken, adminOrPermission("gestionar_roles"), asignarPermisoARol);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_roles"), eliminarPermisoDeRol);

export default router;