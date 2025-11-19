import express from "express";
import { listarTallas, crearTalla, actualizarTalla, eliminarTalla } from "../controllers/tallasController.js";

const router = express.Router();

router.get("/", listarTallas);
router.post("/", crearTalla);
router.put("/:id", actualizarTalla);
router.delete("/:id", eliminarTalla);

export default router;
