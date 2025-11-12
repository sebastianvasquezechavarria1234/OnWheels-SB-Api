import sql from "mssql"
import Venta from "../models/Ventas.js"

// ✅ Obtener todas las ventas
export const getVentas = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query(`
      SELECT id_venta, id_usuario, id_metodo_pago, estado_venta, fecha_venta
      FROM VENTAS
    `)

    const ventas = result.recordset.map(row => new Venta(row))
    res.json(ventas)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener ventas" })
  }
}
// ✅ Actualizar venta
export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params
    const { id_usuario, id_metodo_pago, estado_venta } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("id_usuario", sql.Int, id_usuario)
      .input("id_metodo_pago", sql.Int, id_metodo_pago)
      .input("estado_venta", sql.VarChar, estado_venta)
      .query(`
        UPDATE VENTAS
        SET id_usuario = @id_usuario,
            id_metodo_pago = @id_metodo_pago,
            estado_venta = @estado_venta
        WHERE id_venta = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" })
    }

    res.json({ mensaje: "Venta actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al actualizar venta", error: err.message })
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
        SELECT id_venta, id_usuario, id_metodo_pago, estado_venta, fecha_venta
        FROM VENTAS
        WHERE id_venta = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" })
    }

    const venta = new Venta(result.recordset[0])
    res.json(venta)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la venta" })
  }
}

// ✅ Crear venta
export const createVenta = async (req, res) => {
  try {
    const { id_usuario, id_metodo_pago, estado_venta } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("id_metodo_pago", sql.Int, id_metodo_pago)
      .input("estado_venta", sql.VarChar, estado_venta)
      .query(`
        INSERT INTO VENTAS (id_usuario, id_metodo_pago, estado_venta, fecha_venta)
        VALUES (@id_usuario, @id_metodo_pago, @estado_venta, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevaVenta = new Venta({
      id_venta: result.recordset[0].id,
      id_usuario,
      id_metodo_pago,
      estado_venta,
      fecha_venta: new Date()
    })

    res.status(201).json(nuevaVenta)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear la venta", error: err.message })
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
