
import express from "express";
import {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar
} from "../controllers/estudiantesController.js";

const router = express.Router();
import estudianteController from '../controllers/estudianteController.mjs';


// CRUD básico de estudiantes
router.post("/", crear);          
router.get("/", listar);           
router.get("/:id", obtenerPorId); 
router.put("/:id", actualizar);    
router.delete("/:id", eliminar); 

export default router;