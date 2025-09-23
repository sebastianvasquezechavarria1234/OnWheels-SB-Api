import sql from "mssql"
import Patrocinador from "../models/Patrocinadores.js"

// ✅ Obtener todos los patrocinadores
export const getPatrocinadores = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM PATROCINADORES ORDER BY nombre_patrocinador ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener patrocinadores" })
  }
}

// ✅ Obtener patrocinador por ID
export const getPatrocinadorById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM PATROCINADORES WHERE id_patrocinador = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener patrocinador" })
  }
}

// ✅ Crear patrocinador
export const createPatrocinador = async (req, res) => {
  try {
    const { nombre_patrocinador, email, telefono, logo_patrocinador } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("nombre_patrocinador", sql.NVarChar, nombre_patrocinador)
      .input("email", sql.NVarChar, email)
      .input("telefono", sql.NVarChar, telefono)
      .input("logo_patrocinador", sql.NVarChar, logo_patrocinador)
      .query(`
        INSERT INTO PATROCINADORES (nombre_patrocinador, email, telefono, logo_patrocinador)
        VALUES (@nombre_patrocinador, @email, @telefono, @logo_patrocinador);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevoPatrocinador = new Patrocinador({
      id_patrocinador: result.recordset[0].id,
      nombre_patrocinador,
      email,
      telefono,
      logo_patrocinador
    })

    res.status(201).json(nuevoPatrocinador)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear patrocinador", error: err.message })
  }
}

// ✅ Actualizar patrocinador
export const updatePatrocinador = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_patrocinador, email, telefono, logo_patrocinador } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre_patrocinador", sql.NVarChar, nombre_patrocinador)
      .input("email", sql.NVarChar, email)
      .input("telefono", sql.NVarChar, telefono)
      .input("logo_patrocinador", sql.NVarChar, logo_patrocinador)
      .query(`
        UPDATE PATROCINADORES
        SET nombre_patrocinador = @nombre_patrocinador,
            email = @email,
            telefono = @telefono,
            logo_patrocinador = @logo_patrocinador
        WHERE id_patrocinador = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" })
    }

    res.json({ mensaje: "Patrocinador actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar patrocinador", error: err.message })
  }
}

// ✅ Eliminar patrocinador
export const deletePatrocinador = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM PATROCINADORES WHERE id_patrocinador = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" })
    }

    res.json({ mensaje: "Patrocinador eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar patrocinador" })
  }
}
