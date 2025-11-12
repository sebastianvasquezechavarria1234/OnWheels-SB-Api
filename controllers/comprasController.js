import { getPool } from "../db/postgresPool.js"
import Compra from "../models/Compras.js"

// ✅ Obtener todas las compras
export const getCompras = async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.query(`
      SELECT c.id_compra, c.nit_proveedor, p.nombre_proveedor,
             c.fecha_compra, c.fecha_aproximada_entrega,
             c.total_compra, c.estado
      FROM compras c
      INNER JOIN proveedores p ON c.nit_proveedor = p.nit_proveedor
      ORDER BY c.fecha_compra DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Error al obtener compras:", error)
    res.status(500).json({ mensaje: "Error al obtener compras" })
  }
}

// ✅ Obtener compra por ID
export const getCompraById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await getPool()
    const result = await pool.query(`
      SELECT c.id_compra, c.nit_proveedor, p.nombre_proveedor,
             c.fecha_compra, c.fecha_aproximada_entrega,
             c.total_compra, c.estado
      FROM compras c
      INNER JOIN proveedores p ON c.nit_proveedor = p.nit_proveedor
      WHERE c.id_compra = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error al obtener compra:", error)
    res.status(500).json({ mensaje: "Error al obtener compra" })
  }
}

// ✅ Crear compra
export const createCompra = async (req, res) => {
  try {
    const { nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body
    const pool = await getPool()

    const result = await pool.query(`
      INSERT INTO compras (nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nit_proveedor, fecha_compra, fecha_aproximada_entrega || null, total_compra, estado])

    const nuevaCompra = new Compra(result.rows[0])
    res.status(201).json(nuevaCompra)
  } catch (error) {
    console.error("Error al crear compra:", error)
    res.status(400).json({ mensaje: "Error al crear compra", error: error.message })
  }
}

// ✅ Actualizar compra
export const updateCompra = async (req, res) => {
  try {
    const { id } = req.params
    const { nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body
    const pool = await getPool()

    const result = await pool.query(`
      UPDATE compras
      SET nit_proveedor = $1,
          fecha_compra = $2,
          fecha_aproximada_entrega = $3,
          total_compra = $4,
          estado = $5
      WHERE id_compra = $6
      RETURNING *
    `, [nit_proveedor, fecha_compra, fecha_aproximada_entrega || null, total_compra, estado, id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json({ mensaje: "Compra actualizada correctamente" })
  } catch (error) {
    console.error("Error al actualizar compra:", error)
    res.status(400).json({ mensaje: "Error al actualizar compra", error: error.message })
  }
}

// ✅ Eliminar compra
export const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await getPool()

    const result = await pool.query("DELETE FROM compras WHERE id_compra = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json({ mensaje: "Compra eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar compra:", error)
    res.status(500).json({ mensaje: "Error al eliminar compra" })
  }
}
