import pool from "../db/postgresPool.js"
import Compra from "../models/Compras.js"

// Obtener todas las compras
export const getCompras = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id_compra,
        c.nit,
        p.nombre_proveedor,
        c.fecha_compra,
        c.total,
        c.estado,
        dc.id_detalle_compra,
        dc.id_producto,
        dc.id_color,
        dc.id_talla,
        dc.cantidad,
        dc.precio_unitario,
        prod.nombre_producto,
        COALESCE(col.nombre_color, '—') AS nombre_color,
        COALESCE(t.nombre_talla, '—') AS nombre_talla
      FROM compras c
      LEFT JOIN proveedores p ON c.nit = p.nit
      LEFT JOIN detalle_compras dc ON c.id_compra = dc.id_compra
      LEFT JOIN productos prod ON dc.id_producto = prod.id_producto
      LEFT JOIN colores col ON dc.id_color = col.id_color
      LEFT JOIN tallas t ON dc.id_talla = t.id_talla
      ORDER BY c.id_compra DESC, dc.id_detalle_compra ASC
    `);

    const comprasMap = new Map();

    result.rows.forEach(row => {
      if (!comprasMap.has(row.id_compra)) {
        comprasMap.set(row.id_compra, {
          id_compra: row.id_compra,
          nit: row.nit,
          nombre_proveedor: row.nombre_proveedor,
          fecha_compra: row.fecha_compra,
          total: row.total,
          estado: row.estado,
          items: []
        });
      }

      if (row.id_detalle_compra != null) {
        comprasMap.get(row.id_compra).items.push({
          id_detalle_compra: row.id_detalle_compra,
          id_producto: row.id_producto,
          nombre_producto: row.nombre_producto,
          id_color: row.id_color,
          nombre_color: row.nombre_color,
          id_talla: row.id_talla,
          nombre_talla: row.nombre_talla,
          qty: row.cantidad,
          price: row.precio_unitario
        });
      }
    });

    const comprasConItems = Array.from(comprasMap.values());
    res.json(comprasConItems);

  } catch (error) {
    console.error("Error en getCompras:", error);
    res.status(500).json({ error: "Error al cargar las compras" });
  }
};

// Obtener compra por ID
export const getCompraById = async (req, res) => {
  try {
    const { id } = req.params
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

// Crear compra
export const createCompra = async (req, res) => {
  try {
    const { nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body

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

// Actualizar compra
export const updateCompra = async (req, res) => {
  try {
    const { id } = req.params
    const { nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body

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

// Eliminar compra
export const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      "DELETE FROM compras WHERE id_compra = $1",
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    res.json({ mensaje: "Compra eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar compra:", error)
    res.status(500).json({ mensaje: "Error al eliminar compra" })
  }
}
