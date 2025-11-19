import express from "express"
import {
  getPermisos,
  getPermisoById,
  createPermiso,
  updatePermiso,
  deletePermiso
} from "../controllers/PermisosController.js"

const router = express.Router()

router.get("/", getPermisos)
router.get("/:id", getPermisoById)
router.post("/", createPermiso)
router.put("/:id", updatePermiso)
router.delete("/:id", deletePermiso)

export default router
