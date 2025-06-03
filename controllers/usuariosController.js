import Usuarios from "../models/Usuarios"

// Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuarios.find()
    res.json(usuarios)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener los usuarios" })
  }
}

// Obtener un usuario por ID
export const getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuarios.findById(req.params.id)
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" })
    res.json(usuario)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el usuario" })
  }
}

// Crear un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const nuevoUsuario = new Usuarios(req.body)
    const guardado = await nuevoUsuario.save()
    res.status(201).json(guardado)
  } catch (err) {
    console.error(err)
    if (err.code === 11000) {
      return res.status(400).json({ mensaje: "El email ya está registrado" })
    }
    res.status(400).json({ mensaje: "Error al crear el usuario", error: err.message })
  }
}

// Actualizar un usuario
export const updateUsuario = async (req, res) => {
  try {
    const actualizado = await Usuarios.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizado) return res.status(404).json({ mensaje: "Usuario no encontrado" })
    res.json(actualizado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar el usuario", error: err.message })
  }
}

// Eliminar un usuario
export const deleteUsuario = async (req, res) => {
  try {
    const eliminado = await Usuarios.findByIdAndDelete(req.params.id)
    if (!eliminado) return res.status(404).json({ mensaje: "Usuario no encontrado" })
    res.json({ mensaje: "Usuario eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar el usuario" })
  }
}
