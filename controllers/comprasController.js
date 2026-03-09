import pool from "../db/postgresPool.js";

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

    result.rows.forEach((row) => {
      if (!comprasMap.has(row.id_compra)) {
        comprasMap.set(row.id_compra, {
          id_compra: row.id_compra,
          nit_proveedor: row.nit,
          nombre_proveedor: row.nombre_proveedor,
          fecha_compra: row.fecha_compra,
          total_compra: row.total,
          items: [],
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
          cantidad: row.cantidad,
          precio_unitario: row.precio_unitario,
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

// Obtener compra por ID (con items)
export const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const headerResult = await pool.query(
      `
      SELECT c.id_compra, c.nit, p.nombre_proveedor,
             c.fecha_compra,
             c.total
      FROM compras c
      LEFT JOIN proveedores p ON c.nit = p.nit
      WHERE c.id_compra = $1
    `,
      [id]
    );

    if (headerResult.rows.length === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const itemsResult = await pool.query(
      `
      SELECT 
        dc.id_detalle_compra,
        dc.id_producto,
        dc.id_color,
        dc.id_talla,
        dc.cantidad,
        dc.precio_unitario,
        prod.nombre_producto,
        col.nombre_color,
        t.nombre_talla
      FROM detalle_compras dc
      LEFT JOIN productos prod ON dc.id_producto = prod.id_producto
      LEFT JOIN colores col ON dc.id_color = col.id_color
      LEFT JOIN tallas t ON dc.id_talla = t.id_talla
      WHERE dc.id_compra = $1
    `,
      [id]
    );

    const row = headerResult.rows[0];
    const compra = {
      id_compra: row.id_compra,
      nit_proveedor: row.nit,
      nombre_proveedor: row.nombre_proveedor,
      fecha_compra: row.fecha_compra,
      total_compra: row.total,
      items: itemsResult.rows
    };
    res.json(compra);
  } catch (error) {
    console.error("Error al obtener compra:", error);
    res.status(500).json({ mensaje: "Error al obtener compra" });
  }
};

// Crear compra — siempre incrementa stock automáticamente
export const createCompra = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      nit_proveedor,
      fecha_compra,
      total_compra,
      items = [],
    } = req.body;

    // 1. Insertar Compra (sin estado)
    const compraRes = await client.query(
      `INSERT INTO compras (nit, fecha_compra, total)
       VALUES ($1, $2, $3)
       RETURNING id_compra`,
      [
        nit_proveedor,
        fecha_compra,
        total_compra,
      ]
    );
    const id_compra = compraRes.rows[0].id_compra;

    // Obtener una categoría Default segura
    let defaultCatId = 1;
    const catCheck = await client.query("SELECT id_categoria FROM categorias_productos LIMIT 1");
    if (catCheck.rows.length > 0) defaultCatId = catCheck.rows[0].id_categoria;

    // 2. Procesar Items — siempre incrementar stock
    for (const item of items) {
      let id_producto = item.id_producto;
      let id_color = item.id_color;
      let id_talla = item.id_talla;
      let id_variante = item.id_variante || null;

      // A) Manejo de Producto (Existente o Nuevo)
      if (!id_producto && item.nombre_producto) {
        const prodCheck = await client.query(
          "SELECT id_producto FROM productos WHERE LOWER(nombre_producto) = LOWER($1)",
          [item.nombre_producto]
        );
        if (prodCheck.rows.length > 0) {
          id_producto = prodCheck.rows[0].id_producto;
        } else {
          const newProd = await client.query(
            `INSERT INTO productos (nombre_producto, descripcion, precio_venta, precio_compra, id_categoria, estado)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_producto`,
            [
              item.nombre_producto,
              item.descripcion || "Producto creado desde compra",
              0,
              item.precio_unitario || 0,
              defaultCatId,
              true,
            ]
          );
          id_producto = newProd.rows[0].id_producto;
        }
      }

      // Validar IDs de variantes nulos
      if (!id_color) id_color = null;
      if (!id_talla) id_talla = null;

      // B) Crear/Buscar Variante
      if (!id_variante && id_producto && id_color && id_talla) {
        const varCheck = await client.query(
          "SELECT id_variante FROM variantes_producto WHERE id_producto = $1 AND id_color = $2 AND id_talla = $3",
          [id_producto, id_color, id_talla]
        );
        if (varCheck.rows.length > 0) {
          id_variante = varCheck.rows[0].id_variante;
        } else {
          const newVar = await client.query(
            "INSERT INTO variantes_producto (id_producto, id_color, id_talla, stock) VALUES ($1, $2, $3, 0) RETURNING id_variante",
            [id_producto, id_color, id_talla]
          );
          id_variante = newVar.rows[0].id_variante;
        }
      }

      // C) Insertar Detalle Compra
      await client.query(
        `INSERT INTO detalle_compras (id_compra, id_producto, id_color, id_talla, cantidad, precio_unitario, id_variante)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id_compra,
          id_producto,
          id_color,
          id_talla,
          item.cantidad,
          item.precio_unitario,
          id_variante
        ]
      );

      // D) Siempre incrementar stock
      if (id_variante) {
        await client.query(
          "UPDATE variantes_producto SET stock = stock + $1 WHERE id_variante = $2",
          [item.cantidad, id_variante]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ mensaje: "Compra registrada correctamente", id_compra });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear compra:", error);
    res.status(400).json({ mensaje: "Error al crear compra", error: error.message });
  } finally {
    client.release();
  }
};

// Actualizar compra — BLOQUEADO
export const updateCompra = async (req, res) => {
  return res.status(400).json({
    mensaje: "Las compras no se pueden editar después de ser registradas."
  });
};

// Eliminar compra — BLOQUEADO
export const deleteCompra = async (req, res) => {
  return res.status(400).json({
    mensaje: "Las compras no se pueden eliminar."
  });
};
