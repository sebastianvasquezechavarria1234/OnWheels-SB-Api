import pool from "../config/postgresPool.js"
import CategoriaEventos from "../models/CategoriaEventos.js"

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categorias_eventos")
    const categorias = result.rows.map(row => new CategoriaEventos(row))
    res.json(categorias)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener categorías" })
  }
}

// Obtener por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "SELECT * FROM categorias_eventos WHERE id_categoria_evento = $1",
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    const categoria = new CategoriaEventos(result.rows[0])
    res.json(categoria)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la categoría" })
  }
}

// Crear nueva categoría
export const createCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion, imagen } = req.body

    const result = await pool.query(
      `INSERT INTO categorias_eventos (nombre_categoria, descripcion, imagen)
       VALUES ($1, $2, $3)
       RETURNING id_categoria_evento`,
      [nombre_categoria, descripcion, imagen]
    )

    const nuevaCategoria = new CategoriaEventos({
      id_categoria_evento: result.rows[0].id_categoria_evento,
      nombre_categoria,
      descripcion,
      imagen
    })

    res.status(201).json(nuevaCategoria)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear categoría", error: err.message })
  }
}

// Actualizar categoría
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_categoria, descripcion, imagen } = req.body

    const result = await pool.query(
      `UPDATE categorias_eventos
       SET nombre_categoria = $1, descripcion = $2, imagen = $3
       WHERE id_categoria_evento = $4`,
      [nombre_categoria, descripcion, imagen, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json({ mensaje: "Categoría actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar categoría", error: err.message })
  }
}

// Eliminar categoría
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "DELETE FROM categorias_eventos WHERE id_categoria_evento = $1",
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json({ mensaje: "Categoría eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar categoría" })
  }
}
