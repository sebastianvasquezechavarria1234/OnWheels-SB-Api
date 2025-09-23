// routes/matriculas.js
import express from "express";
import {
  getMatriculas,
  getMatriculaById,
  createMatricula,
  updateMatricula,
  deleteMatricula,
} from "../controllers/matriculasController.js";

const router = express.Router();

router.get("/", getMatriculas);
router.get("/:id", getMatriculaById);
router.post("/", createMatricula);
router.put("/:id", updateMatricula);
router.delete("/:id", deleteMatricula);

export default router;
