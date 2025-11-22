import express from "express"
import { authenticateToken, authorizeModule } from "../middleware/authMiddleware.js"
import { getVentas, getVentaById, createVenta, updateVenta, deleteVenta } from "../controllers/ventasController.js"

const router = express.Router()

router.get("/", authenticateToken, authorizeModule("ventas"), getVentas)
router.get("/:id", authenticateToken, authorizeModule("ventas"), getVentaById)
router.post("/", authenticateToken, authorizeModule("ventas"), createVenta)
router.put("/:id", authenticateToken, authorizeModule("ventas"), updateVenta)
router.delete("/:id", authenticateToken, authorizeModule("ventas"), deleteVenta)

export default router
