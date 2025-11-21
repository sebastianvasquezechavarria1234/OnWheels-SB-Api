// controllers/rolesController.js
import pool from "../db/postgresPool.js"
import Rol from "../models/Roles.js"

// ✅ Obtener todos los roles
export const getRoles = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM roles ORDER BY nombre_rol ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener roles" })
  }
}

// ✅ Obtener rol por ID
export const getRolById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("SELECT * FROM roles WHERE id_rol = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener rol" })
  }
}

// ✅ Crear rol
export const createRol = async (req, res) => {
  try {
    const { nombre_rol, descripcion, estado } = req.body

    const result = await pool.query(
      `INSERT INTO roles (nombre_rol, descripcion, estado)
       VALUES ($1, $2, $3)
       RETURNING id_rol`,
      [nombre_rol, descripcion, estado]
    )

    const nuevoRol = new Rol({
      id_rol: result.rows[0].id_rol,
      nombre_rol,
      descripcion,
      estado
    })

    res.status(201).json(nuevoRol)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear rol", error: err.message })
  }
}

// ✅ Actualizar rol
export const updateRol = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_rol, descripcion, estado } = req.body

    const result = await pool.query(
      `UPDATE roles
       SET nombre_rol = $1,
           descripcion = $2,
           estado = $3
       WHERE id_rol = $4`,
      [nombre_rol, descripcion, estado, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json({ mensaje: "Rol actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar rol", error: err.message })
  }
}

// ✅ Eliminar rol
export const deleteRol = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("DELETE FROM roles WHERE id_rol = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json({ mensaje: "Rol eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar rol" })
  }
}
