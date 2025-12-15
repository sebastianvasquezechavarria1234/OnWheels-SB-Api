import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getPlanes,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from "../controllers/planesController.js";

const router = express.Router();

router.get("/", getPlanes);
router.get("/:id", getPlanById);

router.post("/", authenticateToken, adminOrPermission("gestionar_planes"), createPlan);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_planes"), updatePlan);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_planes"), deletePlan);

export default router;
