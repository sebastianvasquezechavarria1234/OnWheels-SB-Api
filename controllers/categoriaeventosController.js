import CategoriaEventos from "../models/CategoriaEventos.js"

export const getCategoriaEventos = async (req, res) => {
  try {
    const { categoria } = req.query
    const filtro = categoria ? { categoria } : {}
    const categorias = await CategoriaEventos.find(filtro).sort({ nombre: 1 })
    res.json(categorias)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener los Categorias" })
  }
}

export const getCategoriaEventosById = async (req, res) => {
  try {
    const categoria = await CategoriaEventos.findById(req.params.id)
    if (!categoria) return res.status(404).json({ mensaje: "Categoria no encontrado" })
    res.json(categoria)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el Categoria" })
  }
}

export const createCategoriaEventos = async (req, res) => {
  try {
    const nuevoCategoria = new CategoriaEventos(req.body)
    const guardado = await nuevoCategoria.save()
    res.status(201).json(guardado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear el Categoria", error: err.message })
  }
}

export const updateCategoriaEventos = async (req, res) => {
  try {
    const actualizado = await CategoriaEventos.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizado) return res.status(404).json({ mensaje: "Categoria no encontrado" })
    res.json(actualizado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar el Categoria", error: err.message })
  }
}

export const deleteCategoriaEventos = async (req, res) => {
  try {
    const eliminado = await Categorias.findByIdAndDelete(req.params.id)
    if (!eliminado) return res.status(404).json({ mensaje: "Categoria no encontrado" })
    res.json({ mensaje: "Categoria eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar el Categoria" })
  }
}
