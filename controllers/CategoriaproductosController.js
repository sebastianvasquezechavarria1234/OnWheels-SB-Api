// controllers/categoriaProductosController.js
import pool from "../db/postgresPool.js";
import CategoriaProducto from "../models/CategoriaProductos.js";

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    // Cambiado: CATEGORIAS_DE_PRODUCTOS por categorias_productos
    const result = await pool.query("SELECT * FROM categorias_productos ORDER BY id_categoria"); // Asegúrate también del nombre de la columna 'id_categoria'
    const categorias = result.rows.map(row => new CategoriaProducto(row));
    res.json(categorias);
  } catch (err) {
    console.error("Error en getCategorias:", err);
    res.status(500).json({ mensaje: "Error al obtener categorías" });
  }
};

// Obtener categoría por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    // Cambiado: CATEGORIAS_DE_PRODUCTOS por categorias_productos
    const result = await pool.query(
      "SELECT * FROM categorias_productos WHERE id_categoria = $1", // Asegúrate del nombre de la columna 'id_categoria'
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    const categoria = new CategoriaProducto(result.rows[0]);
    res.json(categoria);
  } catch (err) {
    console.error("Error en getCategoriaById:", err);
    res.status(500).json({ mensaje: "Error al obtener categoría" });
  }
};

// Crear nueva categoría
export const createCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion } = req.body;

    // Cambiado: CATEGORIAS_DE_PRODUCTOS por categorias_productos
    const result = await pool.query(
      `INSERT INTO categorias_productos (nombre_categoria, descripcion) -- Asegúrate de los nombres de las columnas
       VALUES ($1, $2) RETURNING *`,
      [nombre_categoria, descripcion]
    );

    const nuevaCategoria = new CategoriaProducto(result.rows[0]);

    res.status(201).json(nuevaCategoria);
  } catch (err) {
    console.error("Error en createCategoria:", err);
    res.status(400).json({ mensaje: "Error al crear categoría", error: err.message });
  }
};

// Actualizar categoría
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, descripcion } = req.body;

    // Cambiado: CATEGORIAS_DE_PRODUCTOS por categorias_productos
    const result = await pool.query(
      `UPDATE categorias_productos -- Asegúrate de los nombres de las columnas
       SET nombre_categoria = $1, descripcion = $2
       WHERE id_categoria = $3`, // Asegúrate del nombre de la columna 'id_categoria'
      [nombre_categoria, descripcion, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    res.json({ mensaje: "Categoría actualizada correctamente" });
  } catch (err) {
    console.error("Error en updateCategoria:", err);
    res.status(400).json({ mensaje: "Error al actualizar categoría", error: err.message });
  }
};

// Eliminar categoría
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    // Cambiado: CATEGORIAS_DE_PRODUCTOS por categorias_productos
    const result = await pool.query(
      "DELETE FROM categorias_productos WHERE id_categoria = $1", // Asegúrate del nombre de la columna 'id_categoria'
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    res.json({ mensaje: "Categoría eliminada correctamente" });
  } catch (err) {
    console.error("Error en deleteCategoria:", err);
    res.status(500).json({ mensaje: "Error al eliminar categoría" });
  }
};