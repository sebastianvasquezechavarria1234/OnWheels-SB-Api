// routes/permisos.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getPermisos,
  getPermisoById,
  createPermiso,
  updatePermiso,
  deletePermiso
} from "../controllers/PermisosController.js";

const router = express.Router();

router.get("/", authenticateToken, adminOrPermission("ver_permisos"), getPermisos);
router.get("/:id", authenticateToken, adminOrPermission("ver_permisos"), getPermisoById);
router.post("/", authenticateToken, adminOrPermission("gestionar_permisos"), createPermiso);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_permisos"), updatePermiso);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_permisos"), deletePermiso);

export default router;