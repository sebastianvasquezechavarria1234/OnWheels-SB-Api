import express from "express";
import {
  getNiveles,
  getNivelById,
  createNivel,
  updateNivel,
  deleteNivel
} from "../controllers/nivelesController.js";

const router = express.Router();

router.get("/", getNiveles);       // Listar todos los niveles
router.get("/:id", getNivelById);  // Obtener nivel por ID
router.post("/", createNivel);     // Crear nuevo nivel
router.put("/:id", updateNivel);   // Actualizar nivel existente
router.delete("/:id", deleteNivel); // Eliminar nivel

export default router;
