// routes/dashboardRoutes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/stats — Solo admin o con permiso ver_ventas
router.get("/stats", authenticateToken, adminOrPermission("ver_ventas"), getDashboardStats);

export default router;
