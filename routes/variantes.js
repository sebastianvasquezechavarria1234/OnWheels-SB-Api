import express from "express";
import { listarVariantes, crearVariante, actualizarVariante, eliminarVariante } from "../controllers/variantesController.js";

const router = express.Router();

router.get("/", listarVariantes);
router.post("/", crearVariante);
router.put("/:id", actualizarVariante);
router.delete("/:id", eliminarVariante);

export default router;
