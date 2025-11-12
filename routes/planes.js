import express from "express";
import {
  getPlanes,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from "../controllers/planesController.js";

const router = express.Router();

router.get("/", getPlanes);        // Obtener todos los planes
router.get("/:id", getPlanById);   // Obtener plan por ID
router.post("/", createPlan);      // Crear plan
router.put("/:id", updatePlan);    // Actualizar plan
router.delete("/:id", deletePlan); // Eliminar plan

export default router;
