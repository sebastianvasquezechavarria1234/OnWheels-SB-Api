// routes/matriculasManualesRoutes.js
import express from "express";
import { crearMatriculaManual } from "../controllers/matriculasManualesController.js";

const router = express.Router();
router.post("/", crearMatriculaManual);
export default router;