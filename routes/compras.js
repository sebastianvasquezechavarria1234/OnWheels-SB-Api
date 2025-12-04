import express from "express";
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  updateCompraStatus
} from "../controllers/comprasController.js";

const router = express.Router();

router.get("/", getCompras);
router.get("/:id", getCompraById);
router.post("/", createCompra);
router.put("/:id", updateCompra);
router.delete("/:id", deleteCompra);
router.patch("/:id/status", updateCompraStatus); // <--- nuevo

export default router;
