import { getPool } from "../db/postgresPool.js";
import Producto from "../models/Productos.js";

// Listar productos
export const listarProductos = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT p.id_producto, p.id_categoria, p.nombre_producto, p.descripcion,
             p.precio_compra, p.precio, p.imagen_producto, p.estado,
             p.porcentaje_ganancia, p.descuento_producto,
             c.nombre_categoria
      FROM PRODUCTOS p
      INNER JOIN CATEGORIAS_DE_PRODUCTOS c ON p.id_categoria = c.id_categoria
    `);
    const productos = result.recordset.map(row => new Producto(row));
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener producto por ID
export const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", id)
      .query(`
        SELECT p.id_producto, p.id_categoria, p.nombre_producto, p.descripcion,
               p.precio_compra, p.precio, p.imagen_producto, p.estado,
               p.porcentaje_ganancia, p.descuento_producto,
               c.nombre_categoria
        FROM PRODUCTOS p
        INNER JOIN CATEGORIAS_DE_PRODUCTOS c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = @id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ mensaje: "Producto no encontrado" });
    const producto = new Producto(result.recordset[0]);
    res.json(producto);
  } catch (error) {
  console.error("❌ Error SQL creando producto:", error); // imprime en consola todo el error
  res.status(500).json({ 
    error: "Error creando producto", 
    detalle: error.message, 
    sql: error?.precedingErrors || null 
  });
}
};
export const crearProducto = async (req, res) => {
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

    // Validar campos obligatorios
    if (!id_categoria || !nombre_producto || !precio) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: id_categoria, nombre_producto y precio"
      });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_categoria", id_categoria)
      .input("nombre_producto", nombre_producto)
      .input("descripcion", descripcion || "")
      .input("precio_compra", precio_compra ?? 0)

      .input("precio", precio)
      .input("imagen_producto", imagen_producto || null)
      .input("estado", estado || 1)
      .input("porcentaje_ganancia", porcentaje_ganancia || 0)
      .input("descuento_producto", descuento_producto || 0)
      .query(`
        INSERT INTO PRODUCTOS (id_categoria, nombre_producto, descripcion, precio_compra, precio, imagen_producto, estado, porcentaje_ganancia, descuento_producto)
        OUTPUT INSERTED.* 
        VALUES (@id_categoria, @nombre_producto, @descripcion, @precio_compra, @precio, @imagen_producto, @estado, @porcentaje_ganancia, @descuento_producto)
      `);

    const nuevo = new Producto(result.recordset[0]);
    res.json(nuevo);

  } catch (error) {
    console.error("❌ Error creando producto:", error);
    res.status(500).json({ error: "Error creando producto", detalle: error.message });
  }
};


// Actualizar producto
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_categoria, nombre_producto, descripcion, precio_compra, precio, imagen_producto, estado, porcentaje_ganancia, descuento_producto } = req.body;
    const pool = await getPool();
    await pool
      .request()
      .input("id_producto", id)
      .input("id_categoria", id_categoria)
      .input("nombre_producto", nombre_producto)
      .input("descripcion", descripcion)
      .input("precio_compra", precio_compra)
      .input("precio", precio)
      .input("imagen_producto", imagen_producto)
      .input("estado", estado)
      .input("porcentaje_ganancia", porcentaje_ganancia)
      .input("descuento_producto", descuento_producto)
      .query(`
        UPDATE PRODUCTOS
        SET id_categoria=@id_categoria, nombre_producto=@nombre_producto, descripcion=@descripcion,
            precio_compra=@precio_compra, precio=@precio, imagen_producto=@imagen_producto,
            estado=@estado, porcentaje_ganancia=@porcentaje_ganancia, descuento_producto=@descuento_producto
        WHERE id_producto=@id_producto
      `);
    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar producto
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input("id_producto", id).query("DELETE FROM PRODUCTOS WHERE id_producto=@id_producto");
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// productosController.js
export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Obtener producto
    const productoResult = await pool
      .request()
      .input("id_producto", id)
      .query(`
        SELECT * 
        FROM PRODUCTOS 
        WHERE id_producto = @id_producto
      `);

    if (productoResult.recordset.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const producto = productoResult.recordset[0];

    // Obtener variantes de este producto
    const variantesResult = await pool
      .request()
      .input("id_producto", id)
      .query(`
        SELECT v.id_variante, v.id_talla, v.id_color, v.stock,
               t.nombre_talla, c.nombre_color, c.codigo_hex
        FROM VARIANTES_PRODUCTO v
        INNER JOIN TALLAS t ON v.id_talla = t.id_talla
        INNER JOIN COLOR c ON v.id_color = c.id_color
        WHERE v.id_producto = @id_producto
      `);

    producto.variantes = variantesResult.recordset;

    res.json(producto);
  } catch (error) {
    console.error("❌ Error obteniendo producto:", error);
    res.status(500).json({ error: "Error obteniendo producto", detalle: error.message });
  }
};
