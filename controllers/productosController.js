import Productos from "../models/Productos.js"

export const getProductos = async (req, res) => {
  try {
    const { categoria } = req.query
    const filtro = categoria ? { categoria } : {}
    const productos = await Productos.find(filtro).sort({ nombre: 1 })
    res.json(productos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener los productos" })
  }
}

export const getProductoById = async (req, res) => {
  try {
    const producto = await Productos.findById(req.params.id)
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" })
    res.json(producto)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el producto" })
  }
}

export const createProducto = async (req, res) => {
  try {
    const nuevoProducto = new Productos(req.body)
    const guardado = await nuevoProducto.save()
    res.status(201).json(guardado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear el producto", error: err.message })
  }
}

export const updateProducto = async (req, res) => {
  try {
    const actualizado = await Productos.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actualizado) return res.status(404).json({ mensaje: "Producto no encontrado" })
    res.json(actualizado)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar el producto", error: err.message })
  }
}

export const deleteProducto = async (req, res) => {
  try {
    const eliminado = await Productos.findByIdAndDelete(req.params.id)
    if (!eliminado) return res.status(404).json({ mensaje: "Producto no encontrado" })
    res.json({ mensaje: "Producto eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar el producto" })
  }
}
