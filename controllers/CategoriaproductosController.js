import sql from "mssql"
import CategoriaProducto from "../models/CategoriaProducto.js"

// ✅ Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM CATEGORIAS_DE_PRODUCTOS ORDER BY nombre_categoria ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener categorías" })
  }
}

// ✅ Obtener categoría por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM CATEGORIAS_DE_PRODUCTOS WHERE id_categoria = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener categoría" })
  }
}

// ✅ Crear categoría
export const createCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("nombre_categoria", sql.VarChar, nombre_categoria)
      .input("descripcion", sql.VarChar, descripcion)
      .query(`
        INSERT INTO CATEGORIAS_DE_PRODUCTOS (nombre_categoria, descripcion)
        VALUES (@nombre_categoria, @descripcion);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const nuevaCategoria = new CategoriaProducto({
      id_categoria: result.recordset[0].id,
      nombre_categoria,
      descripcion
    })

    res.status(201).json(nuevaCategoria)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear categoría", error: err.message })
  }
}

// ✅ Actualizar categoría
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_categoria, descripcion } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre_categoria", sql.VarChar, nombre_categoria)
      .input("descripcion", sql.VarChar, descripcion)
      .query(`
        UPDATE CATEGORIAS_DE_PRODUCTOS
        SET nombre_categoria = @nombre_categoria,
            descripcion = @descripcion
        WHERE id_categoria = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json({ mensaje: "Categoría actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar categoría", error: err.message })
  }
}

// ✅ Eliminar categoría
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM CATEGORIAS_DE_PRODUCTOS WHERE id_categoria = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json({ mensaje: "Categoría eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar categoría" })
  }
}
