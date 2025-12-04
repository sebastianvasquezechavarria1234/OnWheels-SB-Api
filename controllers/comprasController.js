// src/controllers/comprasController.js

import pool from "../db/postgresPool.js";

/**
 * Busca variante EXACTA por combinación de producto, color y talla.
 * Coincidencia correcta:
 * - id_color = $2  OR ambos NULL
 * - id_talla = $3  OR ambos NULL
 */
const findIdVariante = async (client, id_producto, id_color, id_talla) => {
  const q = `
    SELECT id_variante
    FROM variantes_producto
    WHERE id_producto = $1
      AND (
            (id_color = $2) OR
            (id_color IS NULL AND $2 IS NULL)
          )
      AND (
            (id_talla = $3) OR
            (id_talla IS NULL AND $3 IS NULL)
          )
    LIMIT 1
  `;
  const r = await client.query(q, [id_producto, id_color, id_talla]);
  return r.rows[0]?.id_variante ?? null;
};

/**
 * Valida que color y talla existan en sus catálogos
 */
const validateColorTallaExist = async (client, id_color, id_talla) => {
  if (id_color != null) {
    const colorRes = await client.query("SELECT 1 FROM colores WHERE id_color = $1", [id_color]);
    if (colorRes.rows.length === 0) {
      throw new Error(`Color con ID ${id_color} no existe en el catálogo`);
    }
  }
  if (id_talla != null) {
    const tallaRes = await client.query("SELECT 1 FROM tallas WHERE id_talla = $1", [id_talla]);
    if (tallaRes.rows.length === 0) {
      throw new Error(`Talla con ID ${id_talla} no existe en el catálogo`);
    }
  }
};

/**
 * Crea una variante si no existe
 */
const ensureVarianteExists = async (client, id_producto, id_color, id_talla) => {
  let id_variante = await findIdVariante(client, id_producto, id_color, id_talla);
  if (!id_variante) {
    const insertVar = await client.query(
      `INSERT INTO variantes_producto (id_producto, id_color, id_talla, stock)
       VALUES ($1, $2, $3, 0)
       RETURNING id_variante`,
      [id_producto, id_color, id_talla]
    );
    id_variante = insertVar.rows[0].id_variante;
  }
  return id_variante;
};

/**
 * ============================================================
 * GET /api/compras   ← VERSIÓN CORREGIDA (con items agrupados)
 * ============================================================
 */
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
    console.error("Error en getCompras (con items):", error);
    res.status(500).json({ error: "Error al cargar las compras" });
  }
};

/**
 * GET /api/compras/:id — con items
 */
export const getCompraById = async (req, res) => {
  const { id } = req.params;
  try {
    const qCompra = `
      SELECT c.id_compra, c.nit, p.nombre_proveedor, c.fecha_compra, c.total, c.estado
      FROM compras c
      LEFT JOIN proveedores p ON c.nit = p.nit
      WHERE c.id_compra = $1
    `;
    const rCompra = await pool.query(qCompra, [id]);
    if (rCompra.rows.length === 0) return res.status(404).json({ mensaje: "Compra no encontrada" });

    const compra = rCompra.rows[0];

    const qItems = `
      SELECT 
        dc.id_detalle_compra,
        dc.id_variante,
        dc.id_producto,
        dc.id_color,
        dc.id_talla,
        dc.cantidad,
        dc.precio_unitario,
        dc.subtotal,
        COALESCE(prod.nombre_producto, '—') AS nombre_producto,
        COALESCE(c.nombre_color, '—') AS nombre_color,
        COALESCE(c.codigo_hex, '#ccc') AS codigo_hex,
        COALESCE(t.nombre_talla, '—') AS nombre_talla
      FROM detalle_compras dc
      LEFT JOIN productos prod ON dc.id_producto = prod.id_producto
      LEFT JOIN colores c ON dc.id_color = c.id_color
      LEFT JOIN tallas t ON dc.id_talla = t.id_talla
      WHERE dc.id_compra = $1
      ORDER BY dc.id_detalle_compra ASC
    `;
    const rItems = await pool.query(qItems, [id]);

    compra.items = rItems.rows.map(item => ({
      id_detalle_compra: item.id_detalle_compra,
      id_variante: item.id_variante,
      id_producto: item.id_producto,
      id_color: item.id_color,
      id_talla: item.id_talla,
      qty: item.cantidad,
      price: item.precio_unitario,
      subtotal: item.subtotal,
      nombre_producto: item.nombre_producto,
      nombre_color: item.nombre_color,
      nombre_talla: item.nombre_talla,
      codigo_hex: item.codigo_hex,
    }));

    res.json(compra);

  } catch (error) {
    console.error("Error al obtener compra:", error);
    res.status(500).json({ mensaje: "Error al obtener compra", error: error.message });
  }
};

/**
 * POST /api/compras
 */
export const createCompra = async (req, res) => {
  const { nit, fecha_compra, estado = "Pendiente", items = [] } = req.body;
  if (!nit || !fecha_compra) return res.status(400).json({ mensaje: "nit y fecha_compra son obligatorios" });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ mensaje: "Debe enviar al menos un item" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertCompraQ = `
      INSERT INTO compras (nit, fecha_compra, total, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING id_compra
    `;
    const rCompra = await client.query(insertCompraQ, [nit, fecha_compra, 0, estado]);
    const idCompra = rCompra.rows[0].id_compra;

    let total = 0;

    for (const it of items) {
      const { id_producto, id_color = null, id_talla = null, qty, price } = it;
      if (!id_producto || !qty || qty <= 0 || !price || price < 0) {
        throw new Error("Cada item debe tener id_producto, qty > 0 y price ≥ 0");
      }

      await validateColorTallaExist(client, id_color, id_talla);

      let id_variante = null;

      if (estado !== "Pendiente") {
        id_variante = await findIdVariante(client, id_producto, id_color, id_talla);
        if (!id_variante) {
          throw new Error(
            `Variante no encontrada para producto ${id_producto} (color:${id_color} talla:${id_talla}). ` +
            `Para usar combinaciones nuevas, registre la compra primero como "Pendiente".`
          );
        }
      }

      const insertDetalleQ = `
        INSERT INTO detalle_compras (id_compra, id_variante, id_producto, id_color, id_talla, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING subtotal
      `;
      const rDet = await client.query(insertDetalleQ, [
        idCompra,
        id_variante,
        id_producto,
        id_color,
        id_talla,
        qty,
        price
      ]);
      total += Number(rDet.rows[0].subtotal);
    }

    await client.query("UPDATE compras SET total = $1 WHERE id_compra = $2", [total, idCompra]);

    await client.query("COMMIT");

    res.status(201).json({ mensaje: "Compra creada correctamente", id_compra: idCompra });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear compra:", error);
    res.status(400).json({ mensaje: "Error al crear compra", error: error.message });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/compras/:id
 */
export const updateCompra = async (req, res) => {
  const { id } = req.params;
  const { nit, fecha_compra, estado = "Pendiente", items = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const rExist = await client.query("SELECT id_compra FROM compras WHERE id_compra = $1", [id]);
    if (rExist.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    await client.query(
      `UPDATE compras SET nit = $1, fecha_compra = $2, estado = $3 WHERE id_compra = $4`,
      [nit, fecha_compra, estado, id]
    );

    await client.query("DELETE FROM detalle_compras WHERE id_compra = $1", [id]);

    let total = 0;

    for (const it of items) {
      const { id_producto, id_color = null, id_talla = null, qty, price } = it;

      if (!id_producto || !qty || qty <= 0 || !price || price < 0) {
        throw new Error("Cada item debe tener id_producto, qty > 0 y price ≥ 0");
      }

      await validateColorTallaExist(client, id_color, id_talla);

      let id_variante = null;

      if (estado !== "Pendiente") {
        id_variante = await findIdVariante(client, id_producto, id_color, id_talla);
        if (!id_variante) {
          throw new Error(
            `Variante no encontrada para producto ${id_producto} (color:${id_color} talla:${id_talla}). ` +
            `Para usar combinaciones nuevas, cambie el estado a "Pendiente".`
          );
        }
      }

      const rDet = await client.query(
        `INSERT INTO detalle_compras (id_compra, id_variante, id_producto, id_color, id_talla, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING subtotal`,
        [id, id_variante, id_producto, id_color, id_talla, qty, price]
      );
      total += Number(rDet.rows[0].subtotal);
    }

    await client.query("UPDATE compras SET total = $1 WHERE id_compra = $2", [total, id]);

    await client.query("COMMIT");
    res.json({ mensaje: "Compra actualizada correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar compra:", error);
    res.status(400).json({ mensaje: "Error al actualizar compra", error: error.message });
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/compras/:id
 */
export const deleteCompra = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM detalle_compras WHERE id_compra = $1", [id]);
    const r = await client.query("DELETE FROM compras WHERE id_compra = $1", [id]);
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }
    await client.query("COMMIT");
    res.json({ mensaje: "Compra eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar compra:", error);
    res.status(500).json({ mensaje: "Error al eliminar compra" });
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/compras/:id/status
 */
export const updateCompraStatus = async (req, res) => {
  const { id } = req.params;
  const { estado, actualizarStock = false } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const rComp = await client.query("SELECT id_compra, estado FROM compras WHERE id_compra = $1", [id]);
    if (rComp.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    if (actualizarStock && estado === "Recibido") {
      const rItems = await client.query(`
        SELECT dc.id_compra, dc.id_producto, dc.id_color, dc.id_talla, dc.cantidad
        FROM detalle_compras dc
        WHERE dc.id_compra = $1
      `, [id]);

      for (const it of rItems.rows) {
        const id_variante = await ensureVarianteExists(
          client,
          it.id_producto,
          it.id_color,
          it.id_talla
        );

        await client.query(
          `UPDATE detalle_compras 
           SET id_variante = $1 
           WHERE id_compra = $2 AND id_producto = $3 AND id_color = $4 AND id_talla = $5`,
          [id_variante, it.id_compra, it.id_producto, it.id_color, it.id_talla]
        );

        await client.query(
          `UPDATE variantes_producto SET stock = stock + $1 WHERE id_variante = $2`,
          [it.cantidad, id_variante]
        );
      }
    }

    await client.query(`UPDATE compras SET estado = $1 WHERE id_compra = $2`, [estado, id]);

    await client.query("COMMIT");
    res.json({ mensaje: "Estado actualizado correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ mensaje: "Error al actualizar estado", error: error.message });
  } finally {
    client.release();
  }
};