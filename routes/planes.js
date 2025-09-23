// routes/planesClases.js
import express from "express";
import {
  getPlanes,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/planesController.js";

const router = express.Router();

// GET /api/planes
router.get("/", getPlanes);

// GET /api/planes/:id
router.get("/:id", getPlanById);

// POST /api/planes
router.post("/", createPlan);

// PUT /api/planes/:id
router.put("/:id", updatePlan);

// DELETE /api/planes/:id
router.delete("/:id", deletePlan);

export default router;
