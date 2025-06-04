import Clases from "../models/Clases.js"

export const getClases = async (req, res) => {
  try {
    const clases = await Clases.find().sort({ horario: 1 })
    res.json(clases)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener las clases" })
  }
}

export const getClaseById = async (req, res) => {
  try {
    const clase = await Clases.findById(req.params.id)
    if (!clase) return res.status(404).json({ mensaje: "Clase no encontrada" })
    res.json(clase)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la clase" })
  }
}

export const createClase = async (req, res) => {
  try {
    const nuevaClase = new Clases(req.body)
    const guardada = await nuevaClase.save()
    res.status(201).json(guardada)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear la clase", error: err.message })
  }
}

export const updateClase = async (req, res) => {
  try {
    const actualizada = await Clases.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizada) return res.status(404).json({ mensaje: "Clase no encontrada" })
    res.json(actualizada)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar la clase", error: err.message })
  }
}

export const deleteClase = async (req, res) => {
  try {
    const eliminada = await Clases.findByIdAndDelete(req.params.id)
    if (!eliminada) return res.status(404).json({ mensaje: "Clase no encontrada" })
    res.json({ mensaje: "Clase eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar la clase" })
  }
}
