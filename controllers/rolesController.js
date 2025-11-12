import sql from "mssql"
import Rol from "../models/Roles.js"

// ✅ Obtener todos los roles
export const getRoles = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM ROLES ORDER BY nombre_rol ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener roles" })
  }
}

// ✅ Obtener rol por ID
export const getRolById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM ROLES WHERE id_rol = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener rol" })
  }
}

// ✅ Crear rol
export const createRol = async (req, res) => {
  try {
    const { nombre_rol, descripcion, estado } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("nombre_rol", sql.VarChar, nombre_rol)
      .input("descripcion", sql.VarChar, descripcion)
      .input("estado", sql.Bit, estado)
      .query(`
        INSERT INTO ROLES (nombre_rol, descripcion, estado)
        VALUES (@nombre_rol, @descripcion, @estado);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevoRol = new Rol({
      id_rol: result.recordset[0].id,
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

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre_rol", sql.VarChar, nombre_rol)
      .input("descripcion", sql.VarChar, descripcion)
      .input("estado", sql.Bit, estado)
      .query(`
        UPDATE ROLES
        SET nombre_rol = @nombre_rol,
            descripcion = @descripcion,
            estado = @estado
        WHERE id_rol = @id
      `)

    if (result.rowsAffected[0] === 0) {
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
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM ROLES WHERE id_rol = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json({ mensaje: "Rol eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar rol" })
  }
}
