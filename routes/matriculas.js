import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  createMatricula,
  getMatriculas,
  getMatriculaById,
  updateMatricula,
  deleteMatricula
} from "../controllers/matriculasController.js";

const router = express.Router();

router.get("/", authenticateToken, adminOrPermission("ver_matriculas"), getMatriculas);
router.get("/:id", authenticateToken, adminOrPermission("ver_matriculas"), getMatriculaById);
router.post("/", authenticateToken, adminOrPermission("gestionar_matriculas"), createMatricula);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_matriculas"), updateMatricula);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_matriculas"), deleteMatricula);

export default router;
