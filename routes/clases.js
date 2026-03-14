// routes/clasesRoutes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getClases,
  getClaseById,
  createClase,
  updateClase,
  deleteClase,
  getClasesInstructor,
  getClasesEstudiante,
  uploadClaseImage
} from "../controllers/clasesController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/test-mounting", (req, res) => res.json({ message: "Clases routes are mounted correctly" }));
router.get("/", getClases);

// ✅ Rutas específicas SIEMPRE antes de /:id
router.get("/mis-clases", authenticateToken, getClasesEstudiante);
router.get("/instructor/:id", authenticateToken, getClasesInstructor);

// ✅ Ruta dinámica al final
router.get("/:id", getClaseById);

router.post("/", authenticateToken, adminOrPermission("gestionar_clases"), createClase);
router.post("/upload", authenticateToken, adminOrPermission("gestionar_clases"), upload.single("imagen"), uploadClaseImage);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_clases"), updateClase);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_clases"), deleteClase);

export default router;
