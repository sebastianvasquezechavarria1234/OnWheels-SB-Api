// routes/nivelesClases.js
import express from "express";
import {
  getNiveles,
  getNivelById,
  createNivel,
  updateNivel,
  deleteNivel,
} from "../controllers/nivelesClasesController.js";

const router = express.Router();

// GET /api/niveles
router.get("/", getNiveles);

// GET /api/niveles/:id
router.get("/:id", getNivelById);

// POST /api/niveles
router.post("/", createNivel);

// PUT /api/niveles/:id
router.put("/:id", updateNivel);

// DELETE /api/niveles/:id
router.delete("/:id", deleteNivel);

export default router;
