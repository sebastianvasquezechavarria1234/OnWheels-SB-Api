import express from "express"
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../controllers/usuariosController.js"

const router = express.Router()

// GET /api/usuarios - Obtener todos los usuarios
router.get("/", getUsuarios)

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get("/:id", getUsuarioById)

// POST /api/usuarios - Crear un nuevo usuario
router.post("/", createUsuario)

// PUT /api/usuarios/:id - Actualizar un usuario
router.put("/:id", updateUsuario)

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete("/:id", deleteUsuario)

export default router
