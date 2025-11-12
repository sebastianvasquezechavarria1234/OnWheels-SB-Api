import express from "express";
import { createColor, getAllColors } from "../controllers/coloresController.js";

const router = express.Router();

// Ruta para crear un color
router.post("/", createColor);

// Ruta para obtener todos los colores
router.get("/", getAllColors);

export default router;
