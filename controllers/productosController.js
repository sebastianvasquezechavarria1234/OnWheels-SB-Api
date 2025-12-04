// controllers/productosController.js
import pool from "../db/postgresPool.js";
import Producto from "../models/Productos.js";

// Listar productos
export const getProductos = async (req, res) => {
  try {
    // Cambiado: 'categorias_de_productos' por 'categorias_productos'
    const result = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio_venta AS precio, -- Asumiendo que 'precio' en el modelo es 'precio_venta' en la DB
        p.imagen AS imagen_producto, -- Asumiendo que 'imagen_producto' en el modelo es 'imagen' en la DB
        p.estado,
        p.descuento AS descuento_producto, -- Asumiendo que 'descuento_producto' en el modelo es 'descuento' en la DB
        p.id_categoria,
        c.nombre_categoria AS categoria_nombre
      FROM PRODUCTOS p -- Nombre corregido de la tabla
      INNER JOIN categorias_productos c -- Nombre corregido de la tabla
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
    // Cambiado: 'categorias_de_productos' por 'categorias_productos'
    const result = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.precio_venta AS precio, -- Asumiendo mapeo
        p.imagen AS imagen_producto, -- Asumiendo mapeo
        p.estado,
        p.descuento AS descuento_producto, -- Asumiendo mapeo
        p.id_categoria,
        c.nombre_categoria AS categoria_nombre
      FROM productos p -- Nombre corregido de la tabla
      INNER JOIN categorias_productos c -- Nombre corregido de la tabla
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
      precio, // Asumiendo que 'precio' en req.body es para 'precio_venta' en la DB
      imagen_producto, // Asumiendo que 'imagen_producto' en req.body es para 'imagen' en la DB
      estado,
      porcentaje_ganancia, // Esta columna no existe en tu esquema
      descuento_producto // Asumiendo que 'descuento_producto' en req.body es para 'descuento' en la DB
    } = req.body;

    // Ajusté los nombres de las columnas para que coincidan con tu esquema
    // y quité 'porcentaje_ganancia' porque no existe en la tabla productos
    const result = await pool.query(
      `INSERT INTO productos -- Nombre corregido de la tabla
      (id_categoria, nombre_producto, descripcion, precio_compra, precio_venta, imagen, estado, descuento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`, // RETURNING * para obtener el producto insertado completo
      [
        id_categoria,
        nombre_producto,
        descripcion,
        precio_compra,
        precio, // Mapeado a precio_venta
        imagen_producto, // Mapeado a imagen
        estado,
        descuento_producto // Mapeado a descuento
        // No se incluye porcentaje_ganancia
      ]
    );

    // Creamos el producto con los datos devueltos por la DB
    const nuevoProducto = new Producto(result.rows[0]);

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
      precio, // Asumiendo que 'precio' en req.body es para 'precio_venta' en la DB
      imagen_producto, // Asumiendo que 'imagen_producto' en req.body es para 'imagen' en la DB
      estado,
      porcentaje_ganancia, // Esta columna no existe en tu esquema
      descuento_producto // Asumiendo que 'descuento_producto' en req.body es para 'descuento' en la DB
    } = req.body;

    // Ajusté los nombres de las columnas para que coincidan con tu esquema
    // y quité 'porcentaje_ganancia' porque no existe en la tabla productos
    const result = await pool.query(
      `UPDATE productos -- Nombre corregido de la tabla
       SET id_categoria = $1,
           nombre_producto = $2,
           descripcion = $3,
           precio_compra = $4,
           precio_venta = $5, -- Mapeado de 'precio'
           imagen = $6, -- Mapeado de 'imagen_producto'
           estado = $7,
           descuento = $8 -- Mapeado de 'descuento_producto'
           -- No se actualiza porcentaje_ganancia
       WHERE id_producto = $9`, // Ajusté el número del placeholder
      [
        id_categoria,
        nombre_producto,
        descripcion,
        precio_compra,
        precio, // Mapeado a precio_venta
        imagen_producto, // Mapeado a imagen
        estado,
        descuento_producto, // Mapeado a descuento
        id // Ahora es $9
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

// Eliminar producto - FUNCIÓN CORREGIDA
// Eliminar producto - MEJORADA
// Eliminar producto - CON MENSAJE ESPECÍFICO PARA EL FRONTEND
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay variantes asociadas
    const variantesResult = await pool.query(
      "SELECT 1 FROM variantes_producto WHERE id_producto = $1 LIMIT 1",
      [id]
    );
    if (variantesResult.rows.length > 0) {
      return res.status(400).json({
        mensaje: "No se puede eliminar el producto porque tiene variantes registradas."
      });
    }

    // Verificar si hay registros en detalle_compras o detalle_ventas
    const comprasResult = await pool.query(
      "SELECT 1 FROM detalle_compras WHERE id_producto = $1 LIMIT 1",
      [id]
    );
    const ventasResult = await pool.query(
      "SELECT 1 FROM detalle_ventas WHERE id_producto = $1 LIMIT 1",
      [id]
    );

    if (comprasResult.rows.length > 0 || ventasResult.rows.length > 0) {
      return res.status(400).json({
        mensaje: "No se puede eliminar el producto porque ya está asociado a compras o ventas."
      });
    }

    // Si pasa ambas validaciones, eliminar el producto
    const result = await pool.query("DELETE FROM productos WHERE id_producto = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    res.json({ mensaje: "Producto eliminado correctamente" });

  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);

    // Para errores inesperados, enviamos un mensaje genérico
    res.status(500).json({ mensaje: "Error al eliminar el producto" });
  }
};