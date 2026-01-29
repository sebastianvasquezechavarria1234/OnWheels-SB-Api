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
        u.nombre_completo AS nombre_cliente,
        u.email,
        u.documento,
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
          INNER JOIN variantes_producto var ON dv.id_variante = var.id_variante
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

// ✅ Obtener mis compras (Usuario logueado) - Sin cambios mayores, solo referencias de tabla
export const getMisCompras = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const clienteResult = await pool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = $1",
      [id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.json([]);
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    const result = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_cliente,
        v.metodo_pago,
        v.estado AS estado,
        v.fecha_venta,
        v.total
      FROM ventas v
      WHERE v.id_cliente = $1
      ORDER BY v.fecha_venta DESC
    `, [id_cliente]);

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
            t.nombre_talla,
            (SELECT imagen_url FROM imagenes_producto ip WHERE ip.id_producto = p.id_producto LIMIT 1) as imagen
          FROM detalle_ventas dv
          INNER JOIN variantes_producto var ON dv.id_variante = var.id_variante
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
    console.error("Error en getMisCompras:", err);
    res.status(500).json({ mensaje: "Error al obtener mis compras" });
  }
};

// ✅ Obtener una venta por ID (completa, con cliente)
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
        v.total,
        u.id_usuario,
        u.nombre_completo AS nombre_cliente,
        u.email,
        u.telefono,
        u.documento,
        c.direccion_envio
      FROM ventas v
      INNER JOIN clientes c ON v.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
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
      INNER JOIN variantes_producto var ON dv.id_variante = var.id_variante
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

// ✅ Crear venta (CON REGLAS DE NEGOCIO STRICTAS)
export const createVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_usuario, metodo_pago, fecha_venta, items = [] } = req.body;

    // Nota: El frontend puede enviar id_usuario. Si envía id_cliente, tendremos que buscar el usuario o asumirlo.
    // Vamos a estandarizar que se envíe id_usuario para poder validar roles fácilmente.

    if (!id_usuario || !items.length) {
      return res.status(400).json({ mensaje: "Usuario y productos son obligatorios" });
    }

    await client.query("BEGIN");

    // 1. GESTIÓN DE ROL Y CLIENTE
    // Verificar si el usuario ya es cliente
    const roleCheck = await client.query(
      "SELECT * FROM usuario_roles WHERE id_usuario = $1 AND id_rol = 12",
      [id_usuario]
    );

    if (roleCheck.rows.length === 0) {
      // Asignar rol Cliente (ID 12)
      await client.query(
        "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, 12)",
        [id_usuario]
      );
    }

    // Verificar si existe registro en tabla clientes
    let id_cliente;
    const clientRecordCheck = await client.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = $1",
      [id_usuario]
    );

    const { direccion, telefono } = req.body;

    if (clientRecordCheck.rows.length === 0) {
      // Crear registro de cliente base
      const user = await client.query("SELECT * FROM usuarios WHERE id_usuario = $1", [id_usuario]);
      if (user.rows.length === 0) throw new Error("Usuario no existe");
      const userData = user.rows[0];

      const newClient = await client.query(
        `INSERT INTO clientes (id_usuario, direccion_envio, telefono_contacto)
         VALUES ($1, $2, $3) RETURNING id_cliente`,
        [
          id_usuario,
          direccion || "Dirección Pendiente",
          telefono || userData.telefono_usuario
        ]
      );
      id_cliente = newClient.rows[0].id_cliente;
    } else {
      id_cliente = clientRecordCheck.rows[0].id_cliente;
      // Opcional: Actualizar datos de contacto si se envían
      if (direccion || telefono) {
        await client.query("UPDATE clientes SET direccion_envio = COALESCE($1, direccion_envio), telefono_contacto = COALESCE($2, telefono_contacto) WHERE id_cliente = $3", [direccion, telefono, id_cliente]);
      }
    }

    // 2. VALIDACIÓN DE PRECIOS Y STOCK
    let totalCalculado = 0;
    const itemsProcesados = [];

    for (const item of items) {
      const { id_variante, cantidad } = item;

      // Buscar variante y su precio (del producto padre)
      const varData = await client.query(`
        SELECT v.id_variante, v.stock, p.precio_venta, p.nombre_producto 
        FROM variantes_producto v
        JOIN productos p ON v.id_producto = p.id_producto
        WHERE v.id_variante = $1
        FOR UPDATE
      `, [id_variante]);

      if (varData.rows.length === 0) {
        throw new Error(`Variante ID ${id_variante} no existe`);
      }

      const { stock, precio_venta, nombre_producto } = varData.rows[0];

      if (stock < cantidad) {
        throw new Error(`Stock insuficiente para ${nombre_producto}. Disponible: ${stock}`);
      }

      // Usar precio de BD, ignorar frontend
      const precioUnitario = Number(precio_venta);
      totalCalculado += precioUnitario * cantidad;

      itemsProcesados.push({
        id_variante,
        cantidad,
        precio_unitario: precioUnitario
      });
    }

    // 3. CREAR VENTA
    const ventaResult = await client.query(
      `INSERT INTO ventas (id_cliente, metodo_pago, estado, fecha_venta, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_venta`,
      [id_cliente, metodo_pago || 'Efectivo', "Pendiente", fecha_venta || new Date(), totalCalculado]
    );
    const id_venta = ventaResult.rows[0].id_venta;

    // 4. INSERTAR DETALLES Y DESCONTAR STOCK
    for (const item of itemsProcesados) {
      await client.query(
        "INSERT INTO detalle_ventas (id_venta, id_variante, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
        [id_venta, item.id_variante, item.cantidad, item.precio_unitario]
      );

      await client.query(
        "UPDATE variantes_producto SET stock = stock - $1 WHERE id_variante = $2",
        [item.cantidad, item.id_variante]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ mensaje: "Venta creada exitosamente", id_venta });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error createVenta:", err);
    res.status(400).json({ mensaje: err.message });
  } finally {
    client.release();
  }
};

// ✅ Actualizar venta (solo si está "Pendiente")
export const updateVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { id_cliente, id_usuario, metodo_pago, fecha_venta, items, direccion, telefono } = req.body;

    await client.query("BEGIN");

    // Verificar estado actual
    const current = await client.query("SELECT estado, id_cliente FROM ventas WHERE id_venta = $1 FOR UPDATE", [id]);
    if (current.rowCount === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (current.rows[0].estado !== "Pendiente") {
      throw new Error("Solo se pueden editar ventas en estado 'Pendiente'");
    }

    // Determinar id_cliente final: usar el enviado directamente, o convertir id_usuario, o mantener el actual
    let finalIdCliente = current.rows[0].id_cliente;

    if (id_cliente) {
      // Si se envía id_cliente directamente, usarlo
      finalIdCliente = id_cliente;
    } else if (id_usuario) {
      // Si se envía id_usuario, convertirlo a id_cliente (lógica de promoción)
      const roleCheck = await client.query("SELECT * FROM usuario_roles WHERE id_usuario = $1 AND id_rol = 12", [id_usuario]);
      if (roleCheck.rows.length === 0) {
        await client.query("INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, 12)", [id_usuario]);
      }
      const clientRecord = await client.query("SELECT id_cliente FROM clientes WHERE id_usuario = $1", [id_usuario]);
      if (clientRecord.rows.length === 0) {
        // Crear cliente rápido
        const user = await client.query("SELECT * FROM usuarios WHERE id_usuario = $1", [id_usuario]);
        if (user.rows.length === 0) throw new Error("Usuario no existe");
        const userData = user.rows[0];
        const newClient = await client.query(
          `INSERT INTO clientes (id_usuario, direccion_envio, telefono_contacto)
             VALUES ($1, $2, $3) RETURNING id_cliente`,
          [id_usuario, direccion || "Dirección Pendiente", telefono || userData.telefono_usuario || ""]
        );
        finalIdCliente = newClient.rows[0].id_cliente;
      } else {
        finalIdCliente = clientRecord.rows[0].id_cliente;
      }
    }

    // ACTUALIZAR INFORMACIÓN DEL CLIENTE (dirección y teléfono) si se proporcionan
    // Convertir strings vacíos a null para que COALESCE funcione correctamente
    const direccionToUpdate = direccion && direccion.trim() !== "" ? direccion : null;
    const telefonoToUpdate = telefono && telefono.trim() !== "" ? telefono : null;

    console.log("🔍 DEBUG updateVenta - Datos recibidos:", {
      id_venta: id,
      id_cliente: finalIdCliente,
      direccion_original: direccion,
      telefono_original: telefono,
      direccion_to_update: direccionToUpdate,
      telefono_to_update: telefonoToUpdate,
      metodo_pago
    });

    if (direccionToUpdate || telefonoToUpdate) {
      const updateResult = await client.query(
        `UPDATE clientes 
         SET direccion_envio = COALESCE($1, direccion_envio), 
             telefono_contacto = COALESCE($2, telefono_contacto) 
         WHERE id_cliente = $3
         RETURNING direccion_envio, telefono_contacto`,
        [direccionToUpdate, telefonoToUpdate, finalIdCliente]
      );
      console.log("✅ Cliente actualizado:", updateResult.rows[0]);
    } else {
      console.log("⚠️ No se actualizó el cliente (direccion y telefono vacíos o null)");
    }

    // REVERTIR STOCK (Devolver items anteriores)
    const oldItems = await client.query("SELECT id_variante, cantidad FROM detalle_ventas WHERE id_venta = $1", [id]);
    for (const old of oldItems.rows) {
      await client.query("UPDATE variantes_producto SET stock = stock + $1 WHERE id_variante = $2", [old.cantidad, old.id_variante]);
    }
    await client.query("DELETE FROM detalle_ventas WHERE id_venta = $1", [id]);

    // PROCESAR NUEVOS ITEMS Y CALCULAR TOTAL
    let totalCalculado = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        const { id_variante, cantidad } = item;

        const varData = await client.query(`
                SELECT v.id_variante, v.stock, p.precio_venta, p.nombre_producto 
                FROM variantes_producto v
                JOIN productos p ON v.id_producto = p.id_producto
                WHERE v.id_variante = $1
            `, [id_variante]);

        if (varData.rows.length === 0) throw new Error(`Variante ${id_variante} no existe`);

        const { stock, precio_venta, nombre_producto } = varData.rows[0];

        if (stock < cantidad) {
          throw new Error(`Stock insuficiente para ${nombre_producto}. Disponible: ${stock}`);
        }

        const precioUnitario = Number(precio_venta);
        totalCalculado += precioUnitario * cantidad;

        // Insertar y descontar
        await client.query(
          "INSERT INTO detalle_ventas (id_venta, id_variante, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
          [id, id_variante, cantidad, precioUnitario]
        );

        await client.query(
          "UPDATE variantes_producto SET stock = stock - $1 WHERE id_variante = $2",
          [cantidad, id_variante]
        );
      }
    }

    // ACTUALIZAR VENTA
    const ventaUpdateResult = await client.query(
      `UPDATE ventas 
         SET id_cliente = $1, metodo_pago = COALESCE($2, metodo_pago), fecha_venta = COALESCE($3, fecha_venta), total = $4 
         WHERE id_venta = $5
         RETURNING id_venta, metodo_pago, fecha_venta, total`,
      [finalIdCliente, metodo_pago, fecha_venta, totalCalculado, id]
    );
    console.log("✅ Venta actualizada:", ventaUpdateResult.rows[0]);

    await client.query("COMMIT");
    res.json({ mensaje: "Venta actualizada correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updateVenta:", err);
    res.status(400).json({ mensaje: err.message });
  } finally {
    client.release();
  }
};

// ✅ Actualizar solo estado (Entregada, Procesada, etc.)
export const updateVentaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    await pool.query("UPDATE ventas SET estado = $1 WHERE id_venta = $2", [estado, id]);
    res.json({ mensaje: "Estado actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al actualizar estado" });
  }
};


// ✅ Eliminar venta (solo si está "Pendiente")
export const deleteVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const current = await client.query("SELECT estado FROM ventas WHERE id_venta = $1 FOR UPDATE", [id]);
    if (current.rowCount === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    if (current.rows[0].estado !== "Pendiente") {
      throw new Error("Solo ventas pendientes pueden eliminarse");
    }

    // Revertir stock
    const items = await client.query("SELECT id_variante, cantidad FROM detalle_ventas WHERE id_venta = $1", [id]);
    for (const item of items.rows) {
      await client.query("UPDATE variantes_producto SET stock = stock + $1 WHERE id_variante = $2", [item.cantidad, item.id_variante]);
    }

    await client.query("DELETE FROM detalle_ventas WHERE id_venta = $1", [id]);
    await client.query("DELETE FROM ventas WHERE id_venta = $1", [id]);

    await client.query("COMMIT");
    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ mensaje: err.message });
  } finally {
    client.release();
  }
};

// ✅ Cancelar venta (Restaurar Stock, Mantener Histórico)
export const cancelVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");

    // 1. Verificar Estado
    const check = await client.query("SELECT estado FROM ventas WHERE id_venta = $1 FOR UPDATE", [id]);
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    const estadoActual = check.rows[0].estado;

    if (estadoActual === "Cancelada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ mensaje: "La venta ya está cancelada" });
    }

    // 2. Restaurar Stock
    const items = await client.query("SELECT id_variante, cantidad FROM detalle_ventas WHERE id_venta = $1", [id]);
    for (const item of items.rows) {
      if (item.id_variante) {
        await client.query("UPDATE variantes_producto SET stock = stock + $1 WHERE id_variante = $2",
          [item.cantidad, item.id_variante]);
      }
    }

    // 3. Update Estado
    await client.query("UPDATE ventas SET estado = 'Cancelada' WHERE id_venta = $1", [id]);

    await client.query("COMMIT");
    res.json({ mensaje: "Venta cancelada correctamente. Stock restaurado." });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error cancelVenta:", err);
    res.status(500).json({ mensaje: "Error al cancelar venta", error: err.message });
  } finally {
    client.release();
  }
};