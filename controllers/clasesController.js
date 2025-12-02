
// controllers/clasesController.js
import pool from "../db/postgresPool.js"

// Obtener todas las clases
export const getClases = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clases")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener clases" })
  }
}

// Obtener una clase por ID
export const getClaseById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "SELECT * FROM clases WHERE id_clase = $1",
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la clase" })
  }
}

// Crear clase
export const createClase = async (req, res) => {
  try {
    const { id_nivel, id_sede, id_instructor, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin } = req.body

    const result = await pool.query(
      `INSERT INTO clases (id_nivel, id_sede, id_instructor, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_clase`,
      [id_nivel, id_sede, id_instructor, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin]
    )

    res.status(201).json({
      id_clase: result.rows[0].id_clase,
      id_nivel,
      id_sede,
      id_instructor,
      cupo_maximo,
      dia_semana,
      descripcion,
      estado,
      hora_inicio,
      hora_fin
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear la clase", error: err.message })
  }
}

// Actualizar clase
export const updateClase = async (req, res) => {
  try {
    const { id } = req.params
    const { id_nivel, id_sede, id_instructor, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin } = req.body

    const result = await pool.query(
      `UPDATE clases
       SET id_nivel = $1,
           id_sede = $2,
           id_instructor = $3,
           cupo_maximo = $4,
           dia_semana = $5,
           descripcion = $6,
           estado = $7,
           hora_inicio = $8,
           hora_fin = $9
       WHERE id_clase = $10`,
      [id_nivel, id_sede, id_instructor, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" })
    }

    res.json({ mensaje: "Clase actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar la clase", error: err.message })
  }
}

// Eliminar clase
export const deleteClase = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "DELETE FROM clases WHERE id_clase = $1",
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" })
    }

    res.json({ mensaje: "Clase eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar la clase" })
  }
}







