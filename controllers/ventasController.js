import sql from "mssql"
import Venta from "../models/Ventas.js"

// ✅ Obtener todas las ventas
export const getVentas = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query(`
      SELECT v.*, u.nombre_completo AS usuario, m.nombre_metodo AS metodo_pago
      FROM VENTAS v
      INNER JOIN USUARIOS u ON v.id_usuario = u.id_usuario
      INNER JOIN METODOS_PAGO m ON v.id_metodo_pago = m.id_metodo_pago
      ORDER BY v.fecha_venta DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener ventas", error: err.message })
  }
}

// ✅ Obtener una venta por ID
export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT v.*, u.nombre_completo AS usuario, m.nombre_metodo AS metodo_pago
        FROM VENTAS v
        INNER JOIN USUARIOS u ON v.id_usuario = u.id_usuario
        INNER JOIN METODOS_PAGO m ON v.id_metodo_pago = m.id_metodo_pago
        WHERE v.id_venta = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la venta", error: err.message })
  }
}

// ✅ Crear una nueva venta
export const createVenta = async (req, res) => {
  try {
    const { id_usuario, id_metodo_pago, estado_venta, fecha_venta } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("id_metodo_pago", sql.Int, id_metodo_pago)
      .input("estado_venta", sql.NVarChar, estado_venta || "pendiente")
      .input("fecha_venta", sql.Date, fecha_venta)
      .query(`
        INSERT INTO VENTAS (id_usuario, id_metodo_pago, estado_venta, fecha_venta)
        VALUES (@id_usuario, @id_metodo_pago, @estado_venta, @fecha_venta);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevaVenta = new Venta({
      id_venta: result.recordset[0].id,
      id_usuario,
      id_metodo_pago,
      estado_venta,
      fecha_venta
    })

    res.status(201).json(nuevaVenta)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear venta", error: err.message })
  }
}

// ✅ Actualizar venta
export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params
    const { id_usuario, id_metodo_pago, estado_venta, fecha_venta } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("id_usuario", sql.Int, id_usuario)
      .input("id_metodo_pago", sql.Int, id_metodo_pago)
      .input("estado_venta", sql.NVarChar, estado_venta)
      .input("fecha_venta", sql.Date, fecha_venta)
      .query(`
        UPDATE VENTAS
        SET id_usuario = @id_usuario,
            id_metodo_pago = @id_metodo_pago,
            estado_venta = @estado_venta,
            fecha_venta = @fecha_venta
        WHERE id_venta = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" })
    }

    res.json({ mensaje: "Venta actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar venta", error: err.message })
  }
}

// ✅ Eliminar venta
export const deleteVenta = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM VENTAS WHERE id_venta = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" })
    }

    res.json({ mensaje: "Venta eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar venta", error: err.message })
  }
}
