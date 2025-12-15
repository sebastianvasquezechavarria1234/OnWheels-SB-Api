// controllers/ventasController.js
import pool from "../db/postgresPool.js";

// ✅ Obtener todas las ventas (con cliente y items)
export const getVentas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_cliente,
        v.metodo_pago,
        v.estado AS estado,
        v.fecha_venta,
        v.total,
        c.id_usuario,
        u.nombre_completo,
        u.email,
        c.direccion_envio
      FROM ventas v
      INNER JOIN clientes c ON v.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
      ORDER BY v.fecha_venta DESC
    `);

    // Obtener items de cada venta
    const ventasConItems = await Promise.all(
      result.rows.map(async (venta) => {
        const items = await pool.query(`
          SELECT 
            dv.id_detalle_venta,
            dv.id_variante,
            dv.cantidad,
            dv.precio_unitario,
            p.id_producto,
            p.nombre_producto,
            co.nombre_color,
            t.nombre_talla
          FROM detalle_ventas dv
          INNER JOIN variantes var ON dv.id_variante = var.id_variante
          INNER JOIN productos p ON var.id_producto = p.id_producto
          LEFT JOIN colores co ON var.id_color = co.id_color
          LEFT JOIN tallas t ON var.id_talla = t.id_talla
          WHERE dv.id_venta = $1
        `, [venta.id_venta]);
        return { ...venta, items: items.rows };
      })
    );

    res.json(ventasConItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener ventas", error: err.message });
  }
};

// ✅ Obtener una venta por ID (completa)
export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const ventaResult = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_cliente,
        v.metodo_pago,
        v.estado AS estado,
        v.fecha_venta,
        v.total
      FROM ventas v
      WHERE v.id_venta = $1
    `, [id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    const venta = ventaResult.rows[0];

    const itemsResult = await pool.query(`
      SELECT 
        dv.id_detalle_venta,
        dv.id_variante,
        dv.cantidad,
        dv.precio_unitario,
        p.id_producto,
        p.nombre_producto,
        co.nombre_color,
        t.nombre_talla
      FROM detalle_ventas dv
      INNER JOIN variantes var ON dv.id_variante = var.id_variante
      INNER JOIN productos p ON var.id_producto = p.id_producto
      LEFT JOIN colores co ON var.id_color = co.id_color
      LEFT JOIN tallas t ON var.id_talla = t.id_talla
      WHERE dv.id_venta = $1
    `, [id]);

    res.json({ ...venta, items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener la venta", error: err.message });
  }
};

// ✅ Crear venta (¡CON VALIDACIÓN DE STOCK Y ACTUALIZACIÓN!)
export const createVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_cliente, metodo_pago, fecha_venta, items = [] } = req.body;

    // Validaciones básicas
    if (!id_cliente || !items.length) {
      return res.status(400).json({ mensaje: "id_cliente y items son obligatorios" });
    }

    // Validar que el cliente exista
    const clienteCheck = await client.query("SELECT id_cliente FROM clientes WHERE id_cliente = $1", [id_cliente]);
    if (clienteCheck.rowCount === 0) {
      return res.status(400).json({ mensaje: "Cliente no válido" });
    }

    // Validar stock y existencia de variantes
    let total = 0;
    for (const item of items) {
      const { id_variante, cantidad, precio_unitario } = item;
      if (!id_variante || !cantidad || !precio_unitario) {
        return res.status(400).json({ mensaje: "Cada item debe tener id_variante, cantidad y precio_unitario" });
      }

      // Verificar que la variante exista y tenga suficiente stock
      const variante = await client.query(
        "SELECT stock FROM variantes WHERE id_variante = $1 FOR UPDATE",
        [id_variante]
      );
      if (variante.rowCount === 0) {
        return res.status(400).json({ mensaje: `Variante ID ${id_variante} no existe` });
      }
      if (variante.rows[0].stock < cantidad) {
        return res.status(400).json({ mensaje: `Stock insuficiente para la variante ID ${id_variante}` });
      }

      total += cantidad * precio_unitario;
    }

    await client.query("BEGIN");

    // Crear venta
    const ventaResult = await client.query(
      `INSERT INTO ventas (id_cliente, metodo_pago, estado, fecha_venta, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_venta`,
      [id_cliente, metodo_pago, "Pendiente", fecha_venta, total]
    );
    const id_venta = ventaResult.rows[0].id_venta;

    // Insertar items y reducir stock
    for (const item of items) {
      const { id_variante, cantidad, precio_unitario } = item;

      // Insertar detalle
      await client.query(
        "INSERT INTO detalle_ventas (id_venta, id_variante, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
        [id_venta, id_variante, cantidad, precio_unitario]
      );

      // Reducir stock
      await client.query(
        "UPDATE variantes SET stock = stock - $1 WHERE id_variante = $2",
        [cantidad, id_variante]
      );
    }

    await client.query("COMMIT");

    // Devolver venta completa
    const fullVenta = await getVentaFull(id_venta, client);
    res.status(201).json(fullVenta);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ mensaje: "Error al crear venta", error: err.message });
  } finally {
    client.release();
  }
};

// Función auxiliar para cargar venta completa
const getVentaFull = async (id_venta, client) => {
  const venta = await client.query(`
    SELECT 
      v.id_venta,
      v.id_cliente,
      v.metodo_pago,
      v.estado AS estado,
      v.fecha_venta,
      v.total
    FROM ventas v
    WHERE v.id_venta = $1
  `, [id_venta]);

  const items = await client.query(`
    SELECT 
      dv.id_detalle_venta,
      dv.id_variante,
      dv.cantidad,
      dv.precio_unitario,
      p.id_producto,
      p.nombre_producto,
      co.nombre_color,
      t.nombre_talla
    FROM detalle_ventas dv
    INNER JOIN variantes var ON dv.id_variante = var.id_variante
    INNER JOIN productos p ON var.id_producto = p.id_producto
    LEFT JOIN colores co ON var.id_color = co.id_color
    LEFT JOIN tallas t ON var.id_talla = t.id_talla
    WHERE dv.id_venta = $1
  `, [id_venta]);

  return { ...venta.rows[0], items: items.rows };
};

// ✅ Actualizar venta (solo si está "Pendiente")
export const updateVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { id_cliente, metodo_pago, estado, fecha_venta, items } = req.body;

    await client.query("BEGIN");

    // Verificar estado actual
    const current = await client.query("SELECT estado FROM ventas WHERE id_venta = $1", [id]);
    if (current.rowCount === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (current.rows[0].estado !== "Pendiente") {
      return res.status(400).json({ mensaje: "Solo se pueden editar ventas en estado 'Pendiente'" });
    }

    // Actualizar encabezado
    await client.query(
      `UPDATE ventas
       SET id_cliente = COALESCE($1, id_cliente),
           metodo_pago = COALESCE($2, metodo_pago),
           fecha_venta = COALESCE($3, fecha_venta)
       WHERE id_venta = $4`,
      [id_cliente, metodo_pago, fecha_venta, id]
    );

    // Si se envían nuevos items, reemplazar (con validación de stock)
    if (items && Array.isArray(items)) {
      // Revertir stock de items anteriores
      const oldItems = await client.query("SELECT id_variante, cantidad FROM detalle_ventas WHERE id_venta = $1", [id]);
      for (const old of oldItems.rows) {
        await client.query("UPDATE variantes SET stock = stock + $1 WHERE id_variante = $2", [old.cantidad, old.id_variante]);
      }

      // Eliminar items anteriores
      await client.query("DELETE FROM detalle_ventas WHERE id_venta = $1", [id]);

      // Validar y agregar nuevos items (igual que en createVenta)
      let total = 0;
      for (const item of items) {
        const { id_variante, cantidad, precio_unitario } = item;
        const variante = await client.query("SELECT stock FROM variantes WHERE id_variante = $1 FOR UPDATE", [id_variante]);
        if (variante.rowCount === 0 || variante.rows[0].stock < cantidad) {
          throw new Error(`Stock insuficiente para variante ${id_variante}`);
        }
        total += cantidad * precio_unitario;
      }

      // Insertar nuevos items y reducir stock
      for (const item of items) {
        await client.query(
          "INSERT INTO detalle_ventas (id_venta, id_variante, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
          [id, item.id_variante, item.cantidad, item.precio_unitario]
        );
        await client.query(
          "UPDATE variantes SET stock = stock - $1 WHERE id_variante = $2",
          [item.cantidad, item.id_variante]
        );
      }

      // Actualizar total
      await client.query("UPDATE ventas SET total = $1 WHERE id_venta = $2", [total, id]);
    }

    await client.query("COMMIT");
    const updated = await getVentaFull(id, client);
    res.json({ mensaje: "Venta actualizada", venta: updated });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ mensaje: "Error al actualizar venta", error: err.message });
  } finally {
    client.release();
  }
};

// ✅ Eliminar venta (solo si está "Pendiente")
export const deleteVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Verificar estado
    const current = await client.query("SELECT estado FROM ventas WHERE id_venta = $1", [id]);
    if (current.rowCount === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (current.rows[0].estado !== "Pendiente") {
      return res.status(400).json({ mensaje: "Solo se pueden eliminar ventas en estado 'Pendiente'" });
    }

    // Revertir stock
    const items = await client.query("SELECT id_variante, cantidad FROM detalle_ventas WHERE id_venta = $1", [id]);
    for (const item of items.rows) {
      await client.query("UPDATE variantes SET stock = stock + $1 WHERE id_variante = $2", [item.cantidad, item.id_variante]);
    }

    await client.query("DELETE FROM detalle_ventas WHERE id_venta = $1", [id]);
    await client.query("DELETE FROM ventas WHERE id_venta = $1", [id]);

    await client.query("COMMIT");
    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ mensaje: "Error al eliminar venta", error: err.message });
  } finally {
    client.release();
  }
};