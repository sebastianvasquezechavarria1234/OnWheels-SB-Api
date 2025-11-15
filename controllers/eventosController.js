import sql from "mssql"
import Evento from "../models/Eventos.js"

// ✅ Obtener todos los eventos
export const getEventos = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM EVENTOS ORDER BY fecha_evento ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener eventos" })
  }
}

// ✅ Obtener un evento por ID
export const getEventoById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM EVENTOS WHERE id_evento = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el evento" })
  }
}

// ✅ Crear un nuevo evento
export const createEvento = async (req, res) => {
  try {
    const {
      id_categoria_evento,
      id_sede,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen_evento,
      estado
    } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id_categoria_evento", sql.Int, id_categoria_evento)
      .input("id_sede", sql.Int, id_sede)
      .input("nombre_evento", sql.NVarChar, nombre_evento)
      .input("fecha_evento", sql.Date, fecha_evento)
      .input("hora_inicio", sql.Time, hora_inicio || null)
      .input("hora_aproximada_fin", sql.Time, hora_aproximada_fin || null)
      .input("descripcion", sql.NVarChar, descripcion || null)
      .input("imagen_evento", sql.NVarChar, imagen_evento || null)
      .input("estado", sql.NVarChar, estado || "activo")
      .query(`
        INSERT INTO EVENTOS 
        (id_categoria_evento, id_sede, nombre_evento, fecha_evento, hora_inicio, hora_aproximada_fin, descripcion, imagen_evento, estado)
        VALUES (@id_categoria_evento, @id_sede, @nombre_evento, @fecha_evento, @hora_inicio, @hora_aproximada_fin, @descripcion, @imagen_evento, @estado);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevoEvento = new Evento({
      id_evento: result.recordset[0].id,
      id_categoria_evento,
      id_sede,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen_evento,
      estado
    })

    res.status(201).json(nuevoEvento)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear evento", error: err.message })
  }
}

// ✅ Actualizar evento
export const updateEvento = async (req, res) => {
  try {
    const { id } = req.params
    const {
      id_categoria_evento,
      id_sede,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen_evento,
      estado
    } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("id_categoria_evento", sql.Int, id_categoria_evento)
      .input("id_sede", sql.Int, id_sede)
      .input("nombre_evento", sql.NVarChar, nombre_evento)
      .input("fecha_evento", sql.Date, fecha_evento)
      .input("hora_inicio", sql.Time, hora_inicio || null)
      .input("hora_aproximada_fin", sql.Time, hora_aproximada_fin || null)
      .input("descripcion", sql.NVarChar, descripcion || null)
      .input("imagen_evento", sql.NVarChar, imagen_evento || null)
      .input("estado", sql.NVarChar, estado)
      .query(`
        UPDATE EVENTOS
        SET id_categoria_evento = @id_categoria_evento,
            id_sede = @id_sede,
            nombre_evento = @nombre_evento,
            fecha_evento = @fecha_evento,
            hora_inicio = @hora_inicio,
            hora_aproximada_fin = @hora_aproximada_fin,
            descripcion = @descripcion,
            imagen_evento = @imagen_evento,
            estado = @estado
        WHERE id_evento = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" })
    }

    res.json({ mensaje: "Evento actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar evento", error: err.message })
  }
}

// ✅ Eliminar evento
export const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM EVENTOS WHERE id_evento = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" })
    }

    res.json({ mensaje: "Evento eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar evento", error: err.message })
  }
}
