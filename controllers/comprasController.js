// import pool from "../db/postgresPool.js"
// import Compra from "../models/Compras.js"

// // ✅ Obtener todas las compras
// export const getCompras = async (req, res) => {
//   try {
//     const pool = await getPool()
//     const result = await pool.query(`
//       SELECT c.id_compra, c.nit_proveedor, p.nombre_proveedor,
//              c.fecha_compra, c.fecha_aproximada_entrega,
//              c.total_compra, c.estado
//       FROM compras c
//       INNER JOIN proveedores p ON c.nit_proveedor = p.nit_proveedor
//       ORDER BY c.fecha_compra DESC
//     `)
//     res.json(result.rows)
//   } catch (error) {
//     console.error("Error al obtener compras:", error)
//     res.status(500).json({ mensaje: "Error al obtener compras" })
//   }
// }

// // ✅ Obtener compra por ID
// export const getCompraById = async (req, res) => {
//   try {
//     const { id } = req.params
//     const pool = await getPool()
//     const result = await pool.query(`
//       SELECT c.id_compra, c.nit_proveedor, p.nombre_proveedor,
//              c.fecha_compra, c.fecha_aproximada_entrega,
//              c.total_compra, c.estado
//       FROM compras c
//       INNER JOIN proveedores p ON c.nit_proveedor = p.nit_proveedor
//       WHERE c.id_compra = $1
//     `, [id])

//     if (result.rows.length === 0) {
//       return res.status(404).json({ mensaje: "Compra no encontrada" })
//     }

//     res.json(result.rows[0])
//   } catch (error) {
//     console.error("Error al obtener compra:", error)
//     res.status(500).json({ mensaje: "Error al obtener compra" })
//   }
// }

// // ✅ Crear compra
// export const createCompra = async (req, res) => {
//   try {
//     const { nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body
//     const pool = await getPool()

//     const result = await pool.query(`
//       INSERT INTO compras (nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado)
//       VALUES ($1, $2, $3, $4, $5)
//       RETURNING *
//     `, [nit_proveedor, fecha_compra, fecha_aproximada_entrega || null, total_compra, estado])

//     const nuevaCompra = new Compra(result.rows[0])
//     res.status(201).json(nuevaCompra)
//   } catch (error) {
//     console.error("Error al crear compra:", error)
//     res.status(400).json({ mensaje: "Error al crear compra", error: error.message })
//   }
// }

// // ✅ Actualizar compra
// export const updateCompra = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado } = req.body
//     const pool = await getPool()

//     const result = await pool.query(`
//       UPDATE compras
//       SET nit_proveedor = $1,
//           fecha_compra = $2,
//           fecha_aproximada_entrega = $3,
//           total_compra = $4,
//           estado = $5
//       WHERE id_compra = $6
//       RETURNING *
//     `, [nit_proveedor, fecha_compra, fecha_aproximada_entrega || null, total_compra, estado, id])

//     if (result.rowCount === 0) {
//       return res.status(404).json({ mensaje: "Compra no encontrada" })
//     }

//     res.json({ mensaje: "Compra actualizada correctamente" })
//   } catch (error) {
//     console.error("Error al actualizar compra:", error)
//     res.status(400).json({ mensaje: "Error al actualizar compra", error: error.message })
//   }
// }

// // ✅ Eliminar compra
// export const deleteCompra = async (req, res) => {
//   try {
//     const { id } = req.params
//     const pool = await getPool()

//     const result = await pool.query("DELETE FROM compras WHERE id_compra = $1", [id])

//     if (result.rowCount === 0) {
//       return res.status(404).json({ mensaje: "Compra no encontrada" })
//     }

//     res.json({ mensaje: "Compra eliminada correctamente" })
//   } catch (error) {
//     console.error("Error al eliminar compra:", error)
//     res.status(500).json({ mensaje: "Error al eliminar compra" })
//   }
// }

import pool from "../db/postgresPool.js"
import Compra from "../models/Compras.js"

// Obtener todas las compras
export const getCompras = async (req, res) => {
  try {
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

// Obtener compra por ID
export const getCompraById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `
      SELECT c.id_compra, c.nit_proveedor, p.nombre_proveedor,
             c.fecha_compra, c.fecha_aproximada_entrega,
             c.total_compra, c.estado
      FROM compras c
      INNER JOIN proveedores p ON c.nit_proveedor = p.nit_proveedor
      WHERE c.id_compra = $1
    `,
      [id],
    )

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

    const result = await pool.query(
      `
      INSERT INTO compras (nit_proveedor, fecha_compra, fecha_aproximada_entrega, total_compra, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [nit_proveedor, fecha_compra, fecha_aproximada_entrega || null, total_compra, estado],
    )

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

    // Si incluye estado, usar la función especial que maneja stock
    if (estado !== undefined) {
      return updateCompraEstado(req, res)
    }

    // Si no incluye estado, hacer update normal
    const result = await pool.query(
      `
      UPDATE compras
      SET nit_proveedor = $1,
          fecha_compra = $2,
          fecha_aproximada_entrega = $3,
          total_compra = $4
      WHERE id_compra = $5
      RETURNING *
    `,
      [nit_proveedor, fecha_compra, fecha_aproximada_entrega || null, total_compra, id],
    )

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

export const updateCompraEstado = async (req, res) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const { estado } = req.body

    // Validar estados permitidos
    const estadosValidos = ["pendiente", "recibida", "cancelada"]
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado inválido. Permitidos: " + estadosValidos.join(", "),
      })
    }

    await client.query("BEGIN")

    // Obtener la compra actual
    const compraActual = await client.query("SELECT estado FROM compras WHERE id_compra = $1", [id])

    if (compraActual.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    const estadoAnterior = compraActual.rows[0].estado

    // Si cambió a "recibida", actualizar stock de productos
    if (estadoAnterior !== "recibida" && estado === "recibida") {
      // Obtener todos los productos de esta compra
      const detalles = await client.query(`SELECT id_producto, cantidad FROM detalle_compras WHERE id_compra = $1`, [
        id,
      ])

      // Actualizar stock para cada producto
      for (const detalle of detalles.rows) {
        await client.query(`UPDATE productos SET stock = stock + $1 WHERE id_producto = $2`, [
          detalle.cantidad,
          detalle.id_producto,
        ])

        // Crear registro de auditoría (opcional)
        await client.query(
          `INSERT INTO auditoria_stock (id_producto, cantidad, tipo, id_compra, fecha)
           VALUES ($1, $2, 'ENTRADA', $3, NOW())`,
          [detalle.id_producto, detalle.cantidad, id],
        )
      }
    }

    // Si cambió de "recibida" a otro estado, revertir stock
    if (estadoAnterior === "recibida" && estado !== "recibida") {
      const detalles = await client.query(`SELECT id_producto, cantidad FROM detalle_compras WHERE id_compra = $1`, [
        id,
      ])

      for (const detalle of detalles.rows) {
        await client.query(`UPDATE productos SET stock = stock - $1 WHERE id_producto = $2`, [
          detalle.cantidad,
          detalle.id_producto,
        ])

        await client.query(
          `INSERT INTO auditoria_stock (id_producto, cantidad, tipo, id_compra, fecha)
           VALUES ($1, $2, 'SALIDA', $3, NOW())`,
          [detalle.id_producto, detalle.cantidad, id],
        )
      }
    }

    // Actualizar estado de la compra
    const result = await client.query(`UPDATE compras SET estado = $1 WHERE id_compra = $2 RETURNING *`, [estado, id])

    await client.query("COMMIT")

    res.json({
      mensaje: "Compra actualizada y stock sincronizado",
      compra: result.rows[0],
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error al actualizar compra:", error)
    res.status(400).json({
      mensaje: "Error al actualizar compra",
      error: error.message,
    })
  } finally {
    client.release()
  }
}
