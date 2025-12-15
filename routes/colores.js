// routes/colores.js
import express from "express";
// Cambia 'getAllColors' por 'getColores'
import { createColor, getColores } from "../controllers/coloresController.js";

const router = express.Router();

// Ruta para crear un color
router.post("/", createColor);

// Ruta para obtener todos los colores
// Usa 'getColores' aquí
router.get("/", getColores);

export default router;