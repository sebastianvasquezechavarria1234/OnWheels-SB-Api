import { getPool } from "../db/postgresPool.js"
import Color from "../models/ColorVariante.js"

// Obtener todos los colores
export const getColores = async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.query("SELECT * FROM color")
    const colores = result.rows.map(row => new Color(row))
    res.json(colores)
  } catch (error) {
    console.error("Error al obtener los colores:", error)
    res.status(500).json({ mensaje: "Error al obtener los colores" })
  }
}

// Obtener color por ID
export const getColorById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await getPool()
    const result = await pool.query("SELECT * FROM color WHERE id_color = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Color no encontrado" })
    }

    const color = new Color(result.rows[0])
    res.json(color)
  } catch (error) {
    console.error("Error al obtener el color:", error)
    res.status(500).json({ mensaje: "Error al obtener el color" })
  }
}

// Crear color
export const createColor = async (req, res) => {
  try {
    const { nombre_color, codigo_hex, descripcion } = req.body
    const pool = await getPool()
    const result = await pool.query(
      `INSERT INTO color (nombre_color, codigo_hex, descripcion)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre_color, codigo_hex, descripcion]
    )

    const nuevoColor = new Color(result.rows[0])
    res.status(201).json(nuevoColor)
  } catch (error) {
    console.error("Error al crear el color:", error)
    res.status(400).json({ mensaje: "Error al crear el color", error: error.message })
  }
}

// Actualizar color
export const updateColor = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_color, codigo_hex, descripcion } = req.body
    const pool = await getPool()

    const result = await pool.query(
      `UPDATE color
       SET nombre_color = $1, codigo_hex = $2, descripcion = $3
       WHERE id_color = $4
       RETURNING *`,
      [nombre_color, codigo_hex, descripcion, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Color no encontrado" })
    }

    res.json({ mensaje: "Color actualizado correctamente" })
  } catch (error) {
    console.error("Error al actualizar el color:", error)
    res.status(400).json({ mensaje: "Error al actualizar el color", error: error.message })
  }
}

// Eliminar color
export const deleteColor = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await getPool()

    const result = await pool.query("DELETE FROM color WHERE id_color = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Color no encontrado" })
    }

    res.json({ mensaje: "Color eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar el color:", error)
    res.status(500).json({ mensaje: "Error al eliminar el color" })
  }
}
