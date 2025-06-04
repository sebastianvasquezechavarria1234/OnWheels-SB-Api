import Eventos from "../models/Eventos.js"

export const getEventos = async (req, res) => {
  try {
    const eventos = await Eventos.find().sort({ fecha: -1 })
    res.json(eventos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener los eventos" })
  }
}

export const getEventoById = async (req, res) => {
  try {
    const evento = await Eventos.findById(req.params.id)
    if (!evento) return res.status(404).json({ mensaje: "Evento no encontrado" })
    res.json(evento)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el evento" })
  }
}

export const createEvento = async (req, res) => {
  try {
    const nuevoEvento = new Eventos(req.body)
    const guardado = await nuevoEvento.save()
    res.status(201).json(guardado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear el evento", error: err.message })
  }
}

export const updateEvento = async (req, res) => {
  try {
    const actualizado = await Eventos.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizado) return res.status(404).json({ mensaje: "Evento no encontrado" })
    res.json(actualizado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar el evento", error: err.message })
  }
}

export const deleteEvento = async (req, res) => {
  try {
    const eliminado = await Eventos.findByIdAndDelete(req.params.id)
    if (!eliminado) return res.status(404).json({ mensaje: "Evento no encontrado" })
    res.json({ mensaje: "Evento eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar el evento" })
  }
}
