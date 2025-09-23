import sql from "mssql"
import Compra from "../models/Compras.js"

// ✅ Obtener todas las compras
export const getCompras = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query(`
      SELECT c.id_compra, c.NIT_proveedor, p.nombre_proveedor,
             c.fecha_compra, c.fecha_aproximada_entrega,
             c.total_compra, c.estado
      FROM COMPRAS c
      INNER JOIN PROVEEDORES p ON c.NIT_proveedor = p.NIT_proveedor
      ORDER BY c.fecha_compra DESC
    `)

    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener compras" })
  }
}

// ✅ Obtener compra por ID
export const getCompraById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT c.id_compra, c.NIT_proveedor, p.nombre_proveedor,
               c.fecha_compra, c.fecha_aproximada_entrega,
               c.total_compra, c.estado
        FROM COMPRAS c
        INNER JOIN PROVEEDORES p ON c.NIT_proveedor = p.NIT_proveedor
        WHERE c.id_compra = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener compra" })
  }
}

// ✅ Crear compra
export const createCompra = async (req, res) => {
  try {
    const { NIT_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("NIT_proveedor", sql.VarChar, NIT_proveedor)
      .input("fecha_compra", sql.Date, fecha_compra)
      .input("fecha_aproximada_entrega", sql.Date, fecha_aproximada_entrega || null)
      .input("total_compra", sql.Decimal(12,2), total_compra)
      .input("estado", sql.VarChar, estado)
      .query(`
        INSERT INTO COMPRAS (NIT_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado)
        VALUES (@NIT_proveedor, @fecha_compra, @fecha_aproximada_entrega, @total_compra, @estado);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevaCompra = new Compra({
      id_compra: result.recordset[0].id,
      NIT_proveedor,
      fecha_compra,
      fecha_aproximada_entrega,
      total_compra,
      estado
    })

    res.status(201).json(nuevaCompra)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear compra", error: err.message })
  }
}

// ✅ Actualizar compra
export const updateCompra = async (req, res) => {
  try {
    const { id } = req.params
    const { NIT_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("NIT_proveedor", sql.VarChar, NIT_proveedor)
      .input("fecha_compra", sql.Date, fecha_compra)
      .input("fecha_aproximada_entrega", sql.Date, fecha_aproximada_entrega || null)
      .input("total_compra", sql.Decimal(12,2), total_compra)
      .input("estado", sql.VarChar, estado)
      .query(`
        UPDATE COMPRAS
        SET NIT_proveedor = @NIT_proveedor,
            fecha_compra = @fecha_compra,
            fecha_aproximada_entrega = @fecha_aproximada_entrega,
            total_compra = @total_compra,
            estado = @estado
        WHERE id_compra = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json({ mensaje: "Compra actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar compra", error: err.message })
  }
}

// ✅ Eliminar compra
export const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM COMPRAS WHERE id_compra = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json({ mensaje: "Compra eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar compra" })
  }
}
