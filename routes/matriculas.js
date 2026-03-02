// routes/matriculas.routes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  crear as createMatricula,
  listar as getMatriculas,
  obtenerPorId as getMatriculaById,
  actualizar as updateMatricula,
  eliminar as deleteMatricula,
  getMisMatriculas,
  getEstudiantesDeInstructor  // ✅ nuevo
} from "../controllers/matriculasController.js";

const router = express.Router();

// ✅ Rutas específicas PRIMERO (antes de /:id para evitar colisiones)

// Mis matrículas (Estudiante autenticado)
router.get("/mis-matriculas", authenticateToken, getMisMatriculas);

// Estudiantes del instructor autenticado
router.get("/instructor/:id_usuario", authenticateToken, getEstudiantesDeInstructor); // ✅ nueva

// Listar matrículas → solo admin o con permiso "ver_matriculas"
router.get("/", authenticateToken, adminOrPermission("ver_matriculas"), getMatriculas);

// Ver una matrícula → solo admin o con "ver_matriculas"
router.get("/:id", authenticateToken, adminOrPermission("ver_matriculas"), getMatriculaById);

// Crear matrícula → solo con "gestionar_matriculas"
router.post("/", authenticateToken, adminOrPermission("gestionar_matriculas"), createMatricula);

// Actualizar matrícula → solo con "gestionar_matriculas"
router.put("/:id", authenticateToken, adminOrPermission("gestionar_matriculas"), updateMatricula);

// Eliminar matrícula → solo con "gestionar_matriculas"
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_matriculas"), deleteMatricula);

export default router;
