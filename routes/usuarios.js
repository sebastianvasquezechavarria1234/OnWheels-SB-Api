import express from "express"
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  verificarEmail,
} from "../controllers/usuariosController.js"

const router = express.Router()

// GET /api/usuarios - Obtener todos los usuarios
router.get("/", getUsuarios)

// GET /api/usuarios/verificar-email/:email - Verificar si email existe
router.get("/verificar-email/:email", verificarEmail)

// GET /api/usuarios/:id - Obtener un usuario por ID incremental
router.get("/:id", getUsuarioById)

// POST /api/usuarios - Crear un nuevo usuario
router.post("/", createUsuario)

// PUT /api/usuarios/:id - Actualizar un usuario por ID incremental
router.put("/:id", updateUsuario)

// DELETE /api/usuarios/:id - Eliminar un usuario por ID incremental
router.delete("/:id", deleteUsuario)

export default router
