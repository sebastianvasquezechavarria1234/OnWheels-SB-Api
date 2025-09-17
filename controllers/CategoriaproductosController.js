import CategoriaProductos from "../models/categoriaproductos.js"

export const getCategoriaProductos = async (req, res) => {
  try {
    const categorias = await Eventos.find().sort({ fecha: -1 })
    res.json(categorias)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener los categorias" })
  }
}

export const getCategoriaProductosById = async (req, res) => {
  try {
    const categoria = await CategoriaProductos.findById(req.params.id)
    if (!categoria) return res.status(404).json({ mensaje: "Evento no encontrado" })
    res.json(categoria)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el evento" })
  }
}

export const createCategoriaProductos = async (req, res) => {
  try {
    const nuevaCategoria = new CategoriaProductos(req.body)
    const guardado = await nuevoEvento.save()
    res.status(201).json(guardado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear el evento", error: err.message })
  }
}

export const updateCategoriaProductos= async (req, res) => {
  try {
    const actualizado = await Eventos.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizado) return res.status(404).json({ mensaje: "Evento no encontrado" })
    res.json(actualizado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar el evento", error: err.message })
  }
}

export const deleteCategoriaProductos= async (req, res) => {
  try {
    const eliminado = await CategoriaProductos.findByIdAndDelete(req.params.id)
    if (!eliminado) return res.status(404).json({ mensaje: "categoria no encontrado" })
    res.json({ mensaje: "categoria eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar el categoria" })
  }
}
