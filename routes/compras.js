import express from "express"
import { authenticateToken, authorizeModule } from "../middleware/authMiddleware.js"
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  updateCompraEstado,
} from "../controllers/comprasController.js"

const router = express.Router()

router.get("/", authenticateToken, authorizeModule("compras"), getCompras)
router.get("/:id", authenticateToken, authorizeModule("compras"), getCompraById)
router.post("/", authenticateToken, authorizeModule("compras"), createCompra)
router.put("/:id", authenticateToken, authorizeModule("compras"), updateCompra)
router.put("/:id/estado", authenticateToken, authorizeModule("compras"), updateCompraEstado)
router.delete("/:id", authenticateToken, authorizeModule("compras"), deleteCompra)

export default router
