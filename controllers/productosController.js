import sql from "mssql"
import Producto from "../models/Productos.js"; 

// ✅ Obtener todos los productos con su categoría
export const getProductos = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.precio_compra,
        p.imagen_producto,
        p.estado,
        p.porcentaje_ganancia,
        p.descuento_producto,
        p.id_categoria,
        c.nombre_categoria AS categoria_nombre
      FROM PRODUCTOS p
      INNER JOIN CATEGORIAS_DE_PRODUCTOS c 
        ON p.id_categoria = c.id_categoria
    `)

    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener productos" })
  }
}

// ✅ Obtener un producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          p.id_producto,
          p.nombre_producto,
          p.descripcion,
          p.precio_compra,
          p.imagen_producto,
          p.estado,
          p.porcentaje_ganancia,
          p.descuento_producto,
          p.id_categoria,
          c.nombre_categoria AS categoria_nombre
        FROM PRODUCTOS p
        INNER JOIN CATEGORIAS_DE_PRODUCTOS c 
          ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el producto" })
  }
}

// ✅ Crear producto
export const createProducto = async (req, res) => {
  try {
    const {
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      imagen_producto,
      estado,
      porcentaje_ganancia,
      descuento_producto
    } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id_categoria", sql.Int, id_categoria)
      .input("nombre_producto", sql.VarChar, nombre_producto)
      .input("descripcion", sql.VarChar, descripcion)
      .input("precio_compra", sql.Decimal(18,2), precio_compra)
      .input("imagen_producto", sql.VarChar, imagen_producto)
      .input("estado", sql.Bit, estado)
      .input("porcentaje_ganancia", sql.Decimal(5,2), porcentaje_ganancia)
      .input("descuento_producto", sql.Decimal(5,2), descuento_producto)
      .query(`
        INSERT INTO PRODUCTOS 
        (id_categoria, nombre_producto, descripcion, precio_compra, imagen_producto, estado, porcentaje_ganancia, descuento_producto)
        VALUES (@id_categoria, @nombre_producto, @descripcion, @precio_compra, @imagen_producto, @estado, @porcentaje_ganancia, @descuento_producto);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    res.status(201).json({ 
      id_producto: result.recordset[0].id,
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      imagen_producto,
      estado,
      porcentaje_ganancia,
      descuento_producto
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear producto", error: err.message })
  }
}

// ✅ Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params
    const {
      id_categoria,
      nombre_producto,
      descripcion,
      precio_compra,
      imagen_producto,
      estado,
      porcentaje_ganancia,
      descuento_producto
    } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("id_categoria", sql.Int, id_categoria)
      .input("nombre_producto", sql.VarChar, nombre_producto)
      .input("descripcion", sql.VarChar, descripcion)
      .input("precio_compra", sql.Decimal(18,2), precio_compra)
      .input("imagen_producto", sql.VarChar, imagen_producto)
      .input("estado", sql.Bit, estado)
      .input("porcentaje_ganancia", sql.Decimal(5,2), porcentaje_ganancia)
      .input("descuento_producto", sql.Decimal(5,2), descuento_producto)
      .query(`
        UPDATE PRODUCTOS
        SET id_categoria = @id_categoria,
            nombre_producto = @nombre_producto,
            descripcion = @descripcion,
            precio_compra = @precio_compra,
            imagen_producto = @imagen_producto,
            estado = @estado,
            porcentaje_ganancia = @porcentaje_ganancia,
            descuento_producto = @descuento_producto
        WHERE id_producto = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" })
    }

    res.json({ mensaje: "Producto actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar producto", error: err.message })
  }
}

// ✅ Eliminar producto
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM PRODUCTOS WHERE id_producto = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" })
    }

    res.json({ mensaje: "Producto eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar producto" })
  }
}
