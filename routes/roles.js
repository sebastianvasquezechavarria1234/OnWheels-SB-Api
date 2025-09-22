import express from "express"
import {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
} from "../controllers/rolesController.js"

const router = express.Router()

router.get("/", getRoles)          // Todos los roles
router.get("/:id", getRolById)     // Rol por ID
router.post("/", createRol)        // Crear rol
router.put("/:id", updateRol)      // Actualizar rol
router.delete("/:id", deleteRol)   // Eliminar rol

export default router
