import sql from "mssql"
import CategoriaEventos from "../models/CategoriaEventos.js"
// Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM CATEGORIAS_EVENTOS")
    
    const categorias = result.recordset.map(row => new CategoriaEventos(row))
    res.json(categorias)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener categorías" })
  }
}

// Obtener por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM CATEGORIAS_EVENTOS WHERE id_categoria_evento = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    const categoria = new CategoriaEventos(result.recordset[0])
    res.json(categoria)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la categoría" })
  }
}

// Crear nueva categoría
export const createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, imagen } = req.body
    const pool = await sql.connect()
    const result = await pool.request()
      .input("nombre", sql.VarChar, nombre)
      .input("descripcion", sql.VarChar, descripcion)
      .input("imagen", sql.VarChar, imagen)
      .query(`INSERT INTO CATEGORIAS_EVENTOS (nombre, descripcion, imagen)
              VALUES (@nombre, @descripcion, @imagen);
              SELECT SCOPE_IDENTITY() as id;`)

    const nuevaCategoria = new CategoriaEventos({
      id_categoria_evento: result.recordset[0].id,
      nombre,
      descripcion,
      imagen
    })

    res.status(201).json(nuevaCategoria)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear categoría", error: err.message })
  }
}

// Actualizar categoría
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, imagen } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar, nombre)
      .input("descripcion", sql.VarChar, descripcion)
      .input("imagen", sql.VarChar, imagen)
      .query(`UPDATE CATEGORIAS_EVENTOS
              SET nombre = @nombre, descripcion = @descripcion, imagen = @imagen
              WHERE id_categoria_evento = @id`)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json({ mensaje: "Categoría actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar categoría", error: err.message })
  }
}

// Eliminar categoría
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM CATEGORIAS_EVENTOS WHERE id_categoria_evento = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" })
    }

    res.json({ mensaje: "Categoría eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar categoría" })
  }
}
