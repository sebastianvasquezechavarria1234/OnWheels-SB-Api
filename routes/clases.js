import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getClases,
  getClaseById,
  createClase,
  updateClase,
  deleteClase,
  getClasesInstructor,
  getClasesInstructorDetailed
} from "../controllers/clasesController.js";

const router = express.Router();

router.get("/", getClases); // público (opcional) o protected list

// 🟢 Nueva ruta: Clases de un instructor específico (Simple para Compatibilidad Web)
router.get("/instructor/:id", authenticateToken, getClasesInstructor);

// 🟢 Nueva ruta: Clases de un instructor específico (Detallada con Estudiantes para App Móvil)
router.get("/instructor-detalladas/:id", authenticateToken, getClasesInstructorDetailed);

router.get("/:id", getClaseById);

router.post("/", authenticateToken, adminOrPermission("gestionar_clases"), createClase);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_clases"), updateClase);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_clases"), deleteClase);

export default router;
