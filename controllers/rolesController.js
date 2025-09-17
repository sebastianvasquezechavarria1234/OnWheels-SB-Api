import Roles from "../models/Roles.js"

export const getRoles = async (req, res) => {
  try {
    const { rol } = req.query
    const filtro = rol ? { rol } : {}
    const roles = await Roles.find(filtro).sort({ nombre: 1 })
    res.json(roles)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener los rols" })
  }
}

export const getRolById = async (req, res) => {
  try {
    const rol = await Roles.findById(req.params.id)
    if (!rol) return res.status(404).json({ mensaje: "rol no encontrado" })
    res.json(rol)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el rol" })
  }
}

export const createRoles = async (req, res) => {
  try {
    const nuevoRol = new Roles(req.body)
    const guardado = await nuevoRol.save()
    res.status(201).json(guardado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear el rol", error: err.message })
  }
}

export const updateRol = async (req, res) => {
  try {
    const actualizado = await Roles.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizado) return res.status(404).json({ mensaje: "rol no encontrado" })
    res.json(actualizado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar el rol", error: err.message })
  }
}

export const deleteRol = async (req, res) => {
  try {
    const eliminado = await Roles.findByIdAndDelete(req.params.id)
    if (!eliminado) return res.status(404).json({ mensaje: "rol no encontrado" })
    res.json({ mensaje: "rol eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar el rol" })
  }
}
