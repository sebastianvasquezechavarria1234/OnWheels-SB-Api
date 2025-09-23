// routes/preinscripciones.js
import express from "express";
import {
  getPreinscripciones,
  getPreinscripcionById,
  createPreinscripcion,
  updatePreinscripcion,
  deletePreinscripcion,
} from "../controllers/preinscripcionController.js";

const router = express.Router();

// GET /api/preinscripciones
router.get("/", getPreinscripciones);

// GET /api/preinscripciones/:id
router.get("/:id", getPreinscripcionById);

// POST /api/preinscripciones
router.post("/", createPreinscripcion);

// PUT /api/preinscripciones/:id
router.put("/:id", updatePreinscripcion);

// DELETE /api/preinscripciones/:id
router.delete("/:id", deletePreinscripcion);

export default router;
