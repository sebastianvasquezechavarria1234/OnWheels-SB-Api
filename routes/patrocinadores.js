import express from "express";
import {
  getPatrocinadores,
  getPatrocinadorById,
  createPatrocinador,
  updatePatrocinador,
  deletePatrocinador
} from "../controllers/patrocinadoresController.js";

const router = express.Router();

router.get("/", getPatrocinadores);        // Obtener todos los patrocinadores
router.get("/:id", getPatrocinadorById);   // Obtener uno por ID
router.post("/", createPatrocinador);      // Crear patrocinador
router.put("/:id", updatePatrocinador);    // Actualizar patrocinador
router.delete("/:id", deletePatrocinador); // Eliminar patrocinador

export default router;
