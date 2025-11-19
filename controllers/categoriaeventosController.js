import pool from "../db/postgresPool.js";
import CategoriaEventos from "../models/CategoriaEventos.js";

// Obtener todas
export const getCategorias = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categorias_eventos ORDER BY id_categoria_evento ASC"
    );
    return res.json(result.rows.map(row => new CategoriaEventos(row)));
  } catch (err) {
    console.error("getCategorias error:", err);
    return res.status(500).json({ mensaje: "Error al obtener categorías" });
  }
};

// Obtener por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM categorias_eventos WHERE id_categoria_evento = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    return res.json(new CategoriaEventos(result.rows[0]));
  } catch (err) {
    console.error("getCategoriaById error:", err);
    return res.status(500).json({ mensaje: "Error al obtener la categoría" });
  }
};

// Crear
export const createCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion } = req.body;

    if (!nombre_categoria || nombre_categoria.trim().length < 2) {
      return res.status(400).json({
        mensaje: "El nombre es obligatorio y debe tener al menos 2 caracteres",
      });
    }

    const result = await pool.query(
      `INSERT INTO categorias_eventos (nombre_categoria, descripcion)
       VALUES ($1, $2)
       RETURNING *`,
      [
        nombre_categoria.trim(),
        descripcion?.trim() || null
      ]
    );

    return res.status(201).json(new CategoriaEventos(result.rows[0]));
  } catch (err) {
    console.error("createCategoria error:", err);
    return res.status(500).json({ mensaje: "Error al crear categoría" });
  }
};

// Actualizar
export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, descripcion } = req.body;

    if (!nombre_categoria || nombre_categoria.trim().length < 2) {
      return res.status(400).json({
        mensaje: "El nombre es obligatorio y debe tener al menos 2 caracteres",
      });
    }

    const result = await pool.query(
      `UPDATE categorias_eventos
       SET nombre_categoria = $1,
           descripcion = $2
       WHERE id_categoria_evento = $3
       RETURNING *`,
      [
        nombre_categoria.trim(),
        descripcion?.trim() || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    return res.json({
      mensaje: "Categoría actualizada correctamente",
      categoria: new CategoriaEventos(result.rows[0]),
    });
  } catch (err) {
    console.error("updateCategoria error:", err);
    return res.status(500).json({ mensaje: "Error al actualizar categoría" });
  }
};

// Eliminar
export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const relacionados = await pool.query(
      "SELECT COUNT(*) AS total FROM eventos WHERE id_categoria_evento = $1",
      [id]
    );

    if (Number(relacionados.rows[0].total) > 0) {
      return res.status(409).json({
        mensaje: "No se puede eliminar la categoría porque tiene eventos asociados",
      });
    }

    const result = await pool.query(
      "DELETE FROM categorias_eventos WHERE id_categoria_evento = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    return res.json({
      mensaje: "Categoría eliminada correctamente",
      categoria: new CategoriaEventos(result.rows[0]),
    });
  } catch (err) {
    console.error("deleteCategoria error:", err);
    return res.status(500).json({ mensaje: "Error al eliminar categoría" });
  }
};
