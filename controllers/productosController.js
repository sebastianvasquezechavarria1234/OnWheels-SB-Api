import pool from "../db/postgresPool.js";
import Producto from "../models/Productos.js";

// Listar productos (con variantes JSON)
export const getProductos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio_venta,
        p.precio_venta AS precio,
        p.estado,
        p.descuento,
        p.descuento AS descuento_producto,
        p.porcentaje_ganancia,
        p.id_categoria,
        c.nombre_categoria,
        -- Imágenes vía Subconsulta
        (
          SELECT COALESCE(json_agg(jsonb_build_object('id_imagen', pi.id_imagen, 'url_imagen', pi.url_imagen)), '[]')
          FROM producto_imagenes pi 
          WHERE pi.id_producto = p.id_producto
        ) AS imagenes,
        -- Variantes vía Subconsulta
        (
          SELECT COALESCE(json_agg(jsonb_build_object(
            'id_variante', v.id_variante,
            'id_color', v.id_color,
            'nombre_color', co.nombre_color,
            'color_hex', co.codigo_hex,
            'id_talla', v.id_talla,
            'nombre_talla', t.nombre_talla,
            'stock', v.stock
          )), '[]')
          FROM variantes_producto v
          LEFT JOIN colores co ON v.id_color = co.id_color
          LEFT JOIN tallas t ON v.id_talla = t.id_talla
          WHERE v.id_producto = p.id_producto
        ) AS variantes
      FROM productos p
      LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
      ORDER BY p.id_producto DESC
    `;

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ mensaje: "Error al obtener productos", error: err.message });
  }
};

// Obtener producto por ID (con variantes)
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio_venta AS precio,
        p.precio_venta,
        p.estado,
        p.descuento AS descuento_producto,
        p.descuento,
        p.porcentaje_ganancia,
        p.id_categoria,
        c.nombre_categoria,
        -- Imágenes vía Subconsulta
        (
          SELECT COALESCE(json_agg(jsonb_build_object('id_imagen', pi.id_imagen, 'url_imagen', pi.url_imagen)), '[]')
          FROM producto_imagenes pi 
          WHERE pi.id_producto = p.id_producto
        ) AS imagenes,
        -- Variantes vía Subconsulta
        (
          SELECT COALESCE(json_agg(jsonb_build_object(
            'id_variante', v.id_variante,
            'id_color', v.id_color,
            'nombre_color', co.nombre_color,
            'color_hex', co.codigo_hex,
            'id_talla', v.id_talla,
            'nombre_talla', t.nombre_talla,
            'stock', v.stock
          )), '[]')
          FROM variantes_producto v
          LEFT JOIN colores co ON v.id_color = co.id_color
          LEFT JOIN tallas t ON v.id_talla = t.id_talla
          WHERE v.id_producto = p.id_producto
        ) AS variantes
      FROM productos p
      LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = $1
    `;

    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener producto:", err);
    res.status(500).json({ mensaje: "Error al obtener el producto" });
  }
};

// Crear producto (Transaccional con variantes)
export const createProducto = async (req, res) => {
  const client = await pool.connect(); // Iniciar cliente para transacción
  try {
    await client.query('BEGIN'); // Iniciar transacción

    let parsedVariantes = [];
    if (typeof req.body.variantes === "string") {
      try {
        parsedVariantes = JSON.parse(req.body.variantes);
      } catch (e) {
        console.error("Error parseando variantes:", e);
      }
    } else if (Array.isArray(req.body.variantes)) {
      parsedVariantes = req.body.variantes;
    }

    let manualUrls = [];
    if (typeof req.body.imagenes_urls === "string") {
      try {
        manualUrls = JSON.parse(req.body.imagenes_urls);
      } catch (e) {
        manualUrls = [req.body.imagenes_urls];
      }
    } else if (Array.isArray(req.body.imagenes_urls)) {
      manualUrls = req.body.imagenes_urls;
    }

    const {
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio, // Frontend envía 'precio' como venta
      estado,
      descuento_producto,
      porcentaje_ganancia
    } = req.body;

    // VALIDACIÓN IMPORTANTE
    if (!id_categoria || isNaN(Number(id_categoria))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ mensaje: "Debe seleccionar una categoría válida." });
    }

    // 1. Insertar Producto
    const insertProductoQuery = `
      INSERT INTO productos 
      (id_categoria, nombre_producto, descripcion, precio_compra, precio_venta, estado, descuento, porcentaje_ganancia)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_producto`;

    const productoValues = [
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio, // precio_venta
      estado, // boolean
      descuento_producto || 0, // descuento
      porcentaje_ganancia || 0
    ];

    const productoResult = await client.query(insertProductoQuery, productoValues);
    const newProductoId = productoResult.rows[0].id_producto;

    // 2. Insertar Imágenes
    // Imágenes desde archivos físicos
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = `/uploads/${file.filename}`;
        await client.query(
          `INSERT INTO producto_imagenes (id_producto, url_imagen) VALUES ($1, $2)`,
          [newProductoId, url]
        );
      }
    }

    // Imágenes manuales (URLs)
    if (manualUrls && manualUrls.length > 0) {
      for (const url of manualUrls) {
        if (typeof url === 'string' && url.trim() !== '') {
          await client.query(
            `INSERT INTO producto_imagenes (id_producto, url_imagen) VALUES ($1, $2)`,
            [newProductoId, url.trim()]
          );
        }
      }
    }

    // 3. Insertar Variantes (si existen)
    if (parsedVariantes && parsedVariantes.length > 0) {
      for (const variante of parsedVariantes) {
        if (variante.id_color || variante.id_talla) { // Permite color O talla
          await client.query(
            `INSERT INTO variantes_producto (id_producto, id_color, id_talla, stock)
              VALUES ($1, $2, $3, $4)`,
            [newProductoId, variante.id_color || null, variante.id_talla || null, variante.stock || 0]
          );
        }
      }
    }

    await client.query('COMMIT'); // Confirmar transacción

    const nuevoProducto = {
      ...req.body,
      id_producto: newProductoId
    };

    res.status(201).json(nuevoProducto);
  } catch (err) {
    await client.query('ROLLBACK'); // Revertir cambios si falla
    console.error("❌ Error al crear producto (Transacción fallida):", err);
    res.status(400).json({ mensaje: "Error al crear producto", error: err.message });
  } finally {
    client.release(); // Liberar cliente
  }
};

// Actualizar producto (Transaccional con variantes)
export const updateProducto = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Parsing formData fields
    let parsedVariantes = [];
    if (typeof req.body.variantes === "string") {
      try {
        parsedVariantes = JSON.parse(req.body.variantes);
      } catch (e) {
        console.error("Error parseando variantes:", e);
      }
    } else if (Array.isArray(req.body.variantes)) {
      parsedVariantes = req.body.variantes;
    }

    let manualUrls = [];
    if (typeof req.body.imagenes_urls === "string") {
      try {
        manualUrls = JSON.parse(req.body.imagenes_urls);
      } catch (e) {
        manualUrls = [req.body.imagenes_urls];
      }
    } else if (Array.isArray(req.body.imagenes_urls)) {
      manualUrls = req.body.imagenes_urls;
    }

    let imgConservadasArray = [];
    if (typeof req.body.imagenes_conservadas === "string") {
      try {
        imgConservadasArray = JSON.parse(req.body.imagenes_conservadas);
      } catch (e) {
        imgConservadasArray = [req.body.imagenes_conservadas]; // fallback
      }
    } else if (Array.isArray(req.body.imagenes_conservadas)) {
      imgConservadasArray = req.body.imagenes_conservadas;
    }

    // Convertir IDs a números
    imgConservadasArray = imgConservadasArray.map(id => Number(id)).filter(id => !isNaN(id));

    const { id } = req.params;
    const {
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio,
      estado,
      porcentaje_ganancia,
      descuento_producto
    } = req.body;

    // 1. Actualizar Datos Básicos
    const updateQuery = `
       UPDATE productos
       SET id_categoria = $1,
           nombre_producto = $2,
           descripcion = $3,
           precio_compra = $4,
           precio_venta = $5,
           estado = $6,
           descuento = $7,
           porcentaje_ganancia = $8
       WHERE id_producto = $9`;

    const updateValues = [
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio,
      estado,
      descuento_producto,
      porcentaje_ganancia,
      id
    ];

    const result = await client.query(updateQuery, updateValues);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    // 2. Gestionar Imágenes
    // Borrar las imágenes que no estén en `imgConservadasArray`
    if (imgConservadasArray.length > 0) {
      const placeholders = imgConservadasArray.map((_, i) => `$${i + 2}`).join(',');
      await client.query(
        `DELETE FROM producto_imagenes WHERE id_producto = $1 AND id_imagen NOT IN (${placeholders})`,
        [id, ...imgConservadasArray]
      );
    } else {
      // Si no se conserva ninguna imagen, borrarlas todas (para este producto)
      await client.query(`DELETE FROM producto_imagenes WHERE id_producto = $1`, [id]);
    }

    // Imágenes desde archivos físicos (nuevas)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = `/uploads/${file.filename}`;
        await client.query(
          `INSERT INTO producto_imagenes (id_producto, url_imagen) VALUES ($1, $2)`,
          [id, url]
        );
      }
    }

    // Imágenes manuales (URLs nuevas)
    if (manualUrls && manualUrls.length > 0) {
      for (const url of manualUrls) {
        if (typeof url === 'string' && url.trim() !== '') {
          await client.query(
            `INSERT INTO producto_imagenes (id_producto, url_imagen) VALUES ($1, $2)`,
            [id, url.trim()]
          );
        }
      }
    }

    // 3. Gestionar Variantes de forma Segura (Evitar romper el historial de ventas)
    // Obtener variantes actuales en base de datos
    const currentVarsRes = await client.query('SELECT * FROM variantes_producto WHERE id_producto = $1', [id]);
    const currentVars = currentVarsRes.rows;
    
    const keepVariantIds = [];

    if (parsedVariantes && parsedVariantes.length > 0) {
      for (const variante of parsedVariantes) {
        if (variante.id_color || variante.id_talla) { // Permite color O talla
          // Buscar si la variante ya existe para este producto
          const existing = currentVars.find(v => 
            (v.id_color === (variante.id_color || null)) && 
            (v.id_talla === (variante.id_talla || null))
          );

          if (existing) {
            // Actualizar el stock existente
            await client.query(
              'UPDATE variantes_producto SET stock = $1 WHERE id_variante = $2',
              [variante.stock || 0, existing.id_variante]
            );
            keepVariantIds.push(existing.id_variante);
          } else {
            // Insertar la nueva variante
            const insRes = await client.query(
              `INSERT INTO variantes_producto (id_producto, id_color, id_talla, stock)
               VALUES ($1, $2, $3, $4) RETURNING id_variante`,
              [id, variante.id_color || null, variante.id_talla || null, variante.stock || 0]
            );
            keepVariantIds.push(insRes.rows[0].id_variante);
          }
        }
      }
    }

    // Identificar las variantes que existían antes pero ya no vinieron en la petición del frontend
    const varsToDelete = currentVars.filter(v => !keepVariantIds.includes(v.id_variante));

    for (const vDel of varsToDelete) {
      try {
        await client.query('SAVEPOINT sp_del_var');
        await client.query('DELETE FROM variantes_producto WHERE id_variante = $1', [vDel.id_variante]);
        await client.query('RELEASE SAVEPOINT sp_del_var');
      } catch (e) {
        await client.query('ROLLBACK TO SAVEPOINT sp_del_var');
        // Si no se puede eliminar porque está atada a una venta, la conservamos pero con stock en 0
        await client.query('UPDATE variantes_producto SET stock = 0 WHERE id_variante = $1', [vDel.id_variante]);
      }
    }

    await client.query('COMMIT');
    res.json({ mensaje: "Producto actualizado correctamente" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error al actualizar producto:", err);
    res.status(400).json({ mensaje: "Error al actualizar producto", error: err.message });
  } finally {
    client.release();
  }
};

// Eliminar producto
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero verificar si existe
    const checkSql = "SELECT * FROM productos WHERE id_producto = $1";
    const check = await pool.query(checkSql, [id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    await pool.query("DELETE FROM variantes_producto WHERE id_producto = $1", [id]);
    await pool.query("DELETE FROM productos WHERE id_producto = $1", [id]);

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    // Verificar restricción de llave foránea (ej. ventas)
    if (err.code === '23503') {
      let mensaje = "No se puede eliminar el producto porque tiene registros asociados. Recomendamos cambiar su estado a Inactivo.";
      if (err.detail.includes("detalle_ventas")) {
        mensaje = "No se puede eliminar el producto porque ya tiene listado de ventas o pedidos asociados. Recomendamos cambiar su estado a Inactivo en su lugar.";
      } else if (err.detail.includes("detalle_compras")) {
        mensaje = "No se puede eliminar el producto porque tiene compras/entradas de inventario asociadas. Recomendamos cambiar su estado a Inactivo.";
      }
      return res.status(400).json({ mensaje });
    }
    res.status(500).json({ mensaje: "Error al eliminar producto", error: err.message });
  }
};