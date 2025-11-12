import pool from "../db/postgresPool.js";
import Producto from "../models/Productos.js";

// ✅ Obtener todos los productos con su categoría
export const getProductos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio,
        p.imagen_producto,
        p.estado,
        p.porcentaje_ganancia,
        p.descuento_producto,
        p.id_categoria,
        c.nombre_categoria AS categoria_nombre
      FROM productos p
      INNER JOIN categorias_de_productos c 
        ON p.id_categoria = c.id_categoria
      ORDER BY p.nombre_producto ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ mensaje: "Error al obtener productos" });
  }
};

// ✅ Obtener producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio,
        p.imagen_producto,
        p.estado,
        p.porcentaje_ganancia,
        p.descuento_producto,
        p.id_categoria,
        c.nombre_categoria AS categoria_nombre
      FROM productos p
      INNER JOIN categorias_de_productos c 
        ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = $1
    `, [id]);

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
      estado,
      porcentaje_ganancia,
      descuento_producto
    } = req.body;

    const result = await pool.query(
      `INSERT INTO productos 
      (id_categoria, nombre_producto, descripcion, precio_compra, precio, imagen_producto, estado, porcentaje_ganancia, descuento_producto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id_producto`,
      [
        id_categoria,
        nombre_producto,
        descripcion,
        precio_compra,
        precio,
        imagen_producto,
        estado,
        porcentaje_ganancia,
        descuento_producto
      ]
    );

    const nuevoProducto = new Producto({
      id_producto: result.rows[0].id_producto,
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      precio,
      imagen_producto,
      estado,
      porcentaje_ganancia,
      descuento_producto
    });

    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    res.status(400).json({ mensaje: "Error al crear producto", error: err.message });
  }
};

// ✅ Actualizar producto
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
           precio = $5,
           imagen_producto = $6,
           estado = $7,
           porcentaje_ganancia = $8,
           descuento_producto = $9
       WHERE id_producto = $10`,
      [
        id_categoria,
        nombre_producto,
        descripcion,
        precio_compra,
        precio,
        imagen_producto,
        estado,
        porcentaje_ganancia,
        descuento_producto,
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

// ✅ Eliminar producto
export const deleteProducto = async (req, res) => {
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
