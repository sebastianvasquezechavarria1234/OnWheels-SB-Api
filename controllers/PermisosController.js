import sql from "mssql"
import Permiso from "../models/Permiso.js"

// ✅ Obtener todos los permisos
export const getPermisos = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM PERMISOS ORDER BY nombre_permiso ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener permisos" })
  }
}

// ✅ Obtener permiso por ID
export const getPermisoById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM PERMISOS WHERE id_permiso = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener permiso" })
  }
}

// ✅ Crear permiso
export const createPermiso = async (req, res) => {
  try {
    const { nombre_permiso, descripcion } = req.body
    const pool = await sql.connect()
    const result = await pool.request()
      .input("nombre_permiso", sql.VarChar, nombre_permiso)
      .input("descripcion", sql.VarChar, descripcion)
      .query(`
        INSERT INTO PERMISOS (nombre_permiso, descripcion)
        VALUES (@nombre_permiso, @descripcion);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevoPermiso = new Permiso({
      id_permiso: result.recordset[0].id,
      nombre_permiso,
      descripcion
    })

    res.status(201).json(nuevoPermiso)
  } catch (err) {
    res.status(400).json({ mensaje: "Error al crear permiso", error: err.message })
  }
}

// ✅ Actualizar permiso
export const updatePermiso = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_permiso, descripcion } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre_permiso", sql.VarChar, nombre_permiso)
      .input("descripcion", sql.VarChar, descripcion)
      .query(`
        UPDATE PERMISOS
        SET nombre_permiso = @nombre_permiso,
            descripcion = @descripcion
        WHERE id_permiso = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    res.json({ mensaje: "Permiso actualizado correctamente" })
  } catch (err) {
    res.status(400).json({ mensaje: "Error al actualizar permiso" })
  }
}

// ✅ Eliminar permiso
export const deletePermiso = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM PERMISOS WHERE id_permiso = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    res.json({ mensaje: "Permiso eliminado correctamente" })
  } catch (err) {
    res.status(500).json({ mensaje: "Error al eliminar permiso" })
  }
}
