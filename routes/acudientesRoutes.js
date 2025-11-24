import express from "express";
import {
  getAcudientes,
  getAcudienteById,
  createAcudiente,
  updateAcudiente,
  deleteAcudiente
} from "../controllers/acudientesController.js";

const router = express.Router();

// Rutas CRUD para acudientes
router.get("/", getAcudientes);
router.get("/:id", getAcudienteById);
router.post("/", createAcudiente);
router.put("/:id", updateAcudiente);
router.delete("/:id", deleteAcudiente);

export default router;