import express from "express";
import multer from "multer";
import path from "path";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from "../controllers/productosController.js";

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // La carpeta uploads se crea en index.js en la raíz del backend
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


router.get("/", getProductos); // público
router.get("/:id", getProductoById); // público

// Permitimos subir múltiples imágenes en el campo "imagenes_archivos"
router.post("/", authenticateToken, adminOrPermission("gestionar_productos"), upload.array('imagenes_archivos', 10), createProducto);
router.put("/:id", authenticateToken, adminOrPermission("gestionar_productos"), upload.array('imagenes_archivos', 10), updateProducto);
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_productos"), deleteProducto);

export default router;
