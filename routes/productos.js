import { Router } from "express"
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from "../controllers/productosController.js"

const router = Router()

router.get("/", getProductos)
router.get("/:id", getProductoById)
router.post("/", createProducto)
router.put("/:id", updateProducto)
router.delete("/:id", deleteProducto)

export default router
