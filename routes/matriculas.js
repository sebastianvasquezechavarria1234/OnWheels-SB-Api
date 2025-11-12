import express from "express";
import {
  getMatriculas,
  getMatriculaById,
  createMatricula,
  updateMatricula,
  deleteMatricula
} from "../controllers/matriculasController.js";

const router = express.Router();

router.get("/", getMatriculas);        // Obtener todas
router.get("/:id", getMatriculaById);  // Obtener una
router.post("/", createMatricula);     // Crear
router.put("/:id", updateMatricula);   // Actualizar
router.delete("/:id", deleteMatricula); // Eliminar

export default router;
