import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getVariantes,
  createVariante,
  updateVariante,
  deleteVariante,
} from "../controllers/variantesController.js";

const router = express.Router();

router.get("/", getVariantes);
router.post("/", authenticateToken, adminOrPermission("gestionar_variantes"), createVariante);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_variantes"), updateVariante);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_variantes"), deleteVariante);

export default router;
