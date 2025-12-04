
import pool from "../db/postgresPool.js"
import Permiso from "../models/Permiso.js"

// Obtener todos los permisos
export const getPermisos = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM permisos ORDER BY nombre_permiso ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener permisos" })
  }
}

// Obtener permiso por ID
export const getPermisoById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("SELECT * FROM permisos WHERE id_permiso = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener permiso" })
  }
}

// Crear permiso
export const createPermiso = async (req, res) => {
  try {
    const { nombre_permiso, descripcion } = req.body
    const result = await pool.query(
      `
      INSERT INTO permisos (nombre_permiso, descripcion)
      VALUES ($1, $2)
      RETURNING id_permiso, nombre_permiso, descripcion
    `,
      [nombre_permiso, descripcion],
    )

    const nuevoPermiso = new Permiso(result.rows[0])
    res.status(201).json(nuevoPermiso)
  } catch (err) {
    res.status(400).json({ mensaje: "Error al crear permiso", error: err.message })
  }
}

// Actualizar permiso
export const updatePermiso = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_permiso, descripcion } = req.body

    const result = await pool.query(
      `
      UPDATE permisos
      SET nombre_permiso = $1,
          descripcion = $2
      WHERE id_permiso = $3
      RETURNING *
    `,
      [nombre_permiso, descripcion, id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    res.json({ mensaje: "Permiso actualizado correctamente" })
  } catch (err) {
    res.status(400).json({ mensaje: "Error al actualizar permiso" })
  }
}

// Eliminar permiso
export const deletePermiso = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("DELETE FROM permisos WHERE id_permiso = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    res.json({ mensaje: "Permiso eliminado correctamente" })
  } catch (err) {
    res.status(500).json({ mensaje: "Error al eliminar permiso" })
  }
}
