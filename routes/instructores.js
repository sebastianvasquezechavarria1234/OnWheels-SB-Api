// routes/instructores.js
import express from "express";
import {
  getInstructores,
  getInstructorById,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getUsuariosNoInstructores
} from "../controllers/instructoresController.js";

const router = express.Router();

router.get("/", getInstructores);
router.get("/:id", getInstructorById);
router.post("/", createInstructor);
router.put("/:id", updateInstructor);
router.delete("/:id", deleteInstructor);

// Endpoint auxiliar para obtener usuarios disponibles
router.get("/usuarios/disponibles", getUsuariosNoInstructores);

export default router;