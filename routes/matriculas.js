// src/routes/matriculasRoutes.js
import express from "express";
import {
  createMatricula,
  getMatriculas,
  getMatriculaById,
  updateMatricula,
  deleteMatricula
} from "../controllers/matriculasController.js";

const router = express.Router();

// CRUD completo de matrículas
router.get("/", getMatriculas);
router.get("/:id", getMatriculaById);
router.post("/", createMatricula);
router.put("/:id", updateMatricula);
router.delete("/:id", deleteMatricula);

export default router;