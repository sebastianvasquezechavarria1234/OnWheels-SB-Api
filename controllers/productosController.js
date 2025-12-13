import pool from "../db/postgresPool.js";
import Producto from "../models/Productos.js";

// Listar productos
// Listar productos con variantes
export const getProductos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio_venta, -- Normalizamos nombre si es necesario
        p.imagen AS imagen,
        p.estado,
        p.descuento,
        c.nombre_categoria,
        -- Agregamos variantes en un array JSON
        COALESCE(
          json_agg(
            json_build_object(
              'id_variante', v.id_variante,
              'id_color', v.id_color,
              'nombre_color', co.nombre_color,
              'color_hex', co.codigo_hex,
              'id_talla', v.id_talla,
              'nombre_talla', t.nombre_talla,
              'stock', v.stock
            ) 
          ) FILTER (WHERE v.id_variante IS NOT NULL), 
          '[]'
        ) AS variantes
      FROM productos p
      LEFT JOIN categorias_productos c ON p.id_categoria = c.id_categoria
      LEFT JOIN variantes_producto v ON p.id_producto = v.id_producto
      LEFT JOIN colores co ON v.id_color = co.id_color
      LEFT JOIN tallas t ON v.id_talla = t.id_talla
      WHERE p.estado = true
      GROUP BY p.id_producto, c.nombre_categoria
      ORDER BY p.nombre_producto ASC
    `;

    const result = await pool.query(sql);

    // Procesamos para limpiar datos duplicados si fuera necesario, 
    // pero json_agg ya nos da la estructura agrupada por producto.
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ mensaje: "Error al obtener productos", error: err.message });
  }
};

// ✅ Obtener producto por ID
// ✅ Obtener producto por ID (con variantes)
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
        p.imagen AS imagen_producto,
        p.estado,
        p.descuento,
        p.id_categoria,
        c.nombre_categoria AS categoria_nombre,
        -- Agregamos variantes en un array JSON
        COALESCE(
          json_agg(
            json_build_object(
              'id_variante', v.id_variante,
              'id_color', v.id_color,
              'nombre_color', co.nombre_color,
              'color_hex', co.codigo_hex,
              'id_talla', v.id_talla,
              'nombre_talla', t.nombre_talla,
              'stock', v.stock
            ) 
          ) FILTER (WHERE v.id_variante IS NOT NULL), 
          '[]'
        ) AS variantes
      FROM productos p
      INNER JOIN categorias_productos c ON p.id_categoria = c.id_categoria
      LEFT JOIN variantes_producto v ON p.id_producto = v.id_producto
      LEFT JOIN colores co ON v.id_color = co.id_color
      LEFT JOIN tallas t ON v.id_talla = t.id_talla
      WHERE p.id_producto = $1
      GROUP BY p.id_producto, c.nombre_categoria
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

// ✅ Crear producto
export const createProducto = async (req, res) => {
  try {
    const {
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio,
      imagen_producto,
      imagen,
      estado,
      descuento
    } = req.body;

    const result = await pool.query(
      `INSERT INTO productos 
      (id_categoria, nombre_producto, descripcion, precio_compra, precio_venta, imagen, estado, descuento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_producto`,
      [
        id_categoria,
        nombre_producto,
        descripcion,
        precio_compra,
        precio_venta,
        imagen,
        estado,
        descuento
      ]
    );

    const nuevoProducto = new Producto({
      id_producto: result.rows[0].id_producto,
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio: precio_venta,
      imagen,
      estado,
      descuento
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    res.status(400).json({ mensaje: "Error al crear producto", error: err.message });
  }
};

// Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio,
      imagen_producto,
      estado,
      porcentaje_ganancia,
      descuento_producto
    } = req.body;

    const result = await pool.query(
      `UPDATE productos
       SET id_categoria = $1,
           nombre_producto = $2,
           descripcion = $3,
           precio_compra = $4,
           precio_venta = $5,
           imagen = $6,
           estado = $7,
           descuento = $8
       WHERE id_producto = $9`,
      [
        id_categoria,
        nombre_producto,
        descripcion,
        precio_compra,
        precio_venta,
        imagen,
        estado,
        descuento,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    res.status(400).json({ mensaje: "Error al actualizar producto", error: err.message });
  }
};

// productosController.js
export const getProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM productos WHERE id_producto = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ mensaje: "Error al eliminar producto" });
  }
};
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query("DELETE FROM productos WHERE id = $1", [id]);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};