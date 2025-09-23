import sql from "mssql"
import Sede from "../models/Sedes.js"

// ✅ Obtener todas las sedes
export const getSedes = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM SEDES ORDER BY nombre_sede ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener sedes" })
  }
}

// ✅ Obtener sede por ID
export const getSedeById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM SEDES WHERE id_sede = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener sede" })
  }
}

// ✅ Crear sede
export const createSede = async (req, res) => {
  try {
    const { nombre_sede, direccion, ciudad, telefono_sede } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("nombre_sede", sql.NVarChar, nombre_sede)
      .input("direccion", sql.NVarChar, direccion)
      .input("ciudad", sql.NVarChar, ciudad)
      .input("telefono_sede", sql.NVarChar, telefono_sede)
      .query(`
        INSERT INTO SEDES (nombre_sede, direccion, ciudad, telefono_sede)
        VALUES (@nombre_sede, @direccion, @ciudad, @telefono_sede);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevaSede = new Sede({
      id_sede: result.recordset[0].id,
      nombre_sede,
      direccion,
      ciudad,
      telefono_sede
    })

    res.status(201).json(nuevaSede)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear sede", error: err.message })
  }
}

// ✅ Actualizar sede
export const updateSede = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_sede, direccion, ciudad, telefono_sede } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre_sede", sql.NVarChar, nombre_sede)
      .input("direccion", sql.NVarChar, direccion)
      .input("ciudad", sql.NVarChar, ciudad)
      .input("telefono_sede", sql.NVarChar, telefono_sede)
      .query(`
        UPDATE SEDES
        SET nombre_sede = @nombre_sede,
            direccion = @direccion,
            ciudad = @ciudad,
            telefono_sede = @telefono_sede
        WHERE id_sede = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" })
    }

    res.json({ mensaje: "Sede actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar sede", error: err.message })
  }
}

// ✅ Eliminar sede
export const deleteSede = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM SEDES WHERE id_sede = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" })
    }

    res.json({ mensaje: "Sede eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar sede" })
  }
}
