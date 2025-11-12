import express from "express"
import {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
} from "../controllers/rolesController.js"

const router = express.Router()

router.get("/", getRoles)        // Obtener todos los roles
router.get("/:id", getRolById)   // Obtener un rol por ID
router.post("/", createRol)      // Crear rol
router.put("/:id", updateRol)    // Actualizar rol
router.delete("/:id", deleteRol) // Eliminar rol

export default router
