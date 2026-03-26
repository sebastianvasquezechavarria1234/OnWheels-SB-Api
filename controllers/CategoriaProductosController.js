// controllers/CategoriaproductosController.js
import pool from "../db/postgresPool.js";


// ──── UTILIDADES ────────────────────────────────────────

const handleError = (res, message, status = 500, error = null) => {
  if (error) console.error(`❌ ${message}:`, error);
  return res.status(status).json({ mensaje: message });
};

// ──── CONTROLADORES ─────────────────────────────────────

export const getCategorias = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categorias_productos ORDER BY id_categoria ASC"
    );
    return res.json(result.rows);
  } catch (err) {
    return handleError(res, "Error al obtener categorías de productos", 500, err);
  }
};

export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM categorias_productos WHERE id_categoria = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return handleError(res, "Categoría no encontrada", 404);
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return handleError(res, "Error al obtener la categoría", 500, err);
  }
};

export const createCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion } = req.body;

    if (!nombre_categoria || nombre_categoria.trim().length < 2) {
      return handleError(res, "El nombre debe tener mínimo 2 caracteres", 400);
    }

    const result = await pool.query(
      `INSERT INTO categorias_productos (nombre_categoria, descripcion)
       VALUES ($1, $2)
       RETURNING *`,
      [nombre_categoria.trim(), descripcion?.trim() || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return handleError(res, "Error al crear categoría", 500, err);
  }
};

export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_categoria, descripcion } = req.body;

    if (!nombre_categoria || nombre_categoria.trim().length < 2) {
      return handleError(res, "El nombre debe tener mínimo 2 caracteres", 400);
    }

    const result = await pool.query(
      `UPDATE categorias_productos
       SET nombre_categoria = $1,
           descripcion = $2
       WHERE id_categoria = $3
       RETURNING *`,
      [nombre_categoria.trim(), descripcion?.trim() || null, id]
    );

    if (result.rows.length === 0) {
      return handleError(res, "Categoría no encontrada", 404);
    }

    return res.json({
      mensaje: "Categoría actualizada correctamente",
      categoria: result.rows[0],
    });
  } catch (err) {
    return handleError(res, "Error al actualizar categoría", 500, err);
  }
};

export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay productos usando esta categoría
    const usados = await pool.query(
      "SELECT COUNT(*) AS total FROM productos WHERE id_categoria = $1",
      [id]
    );

    if (Number(usados.rows[0].total) > 0) {
      return handleError(
        res,
        "No se puede eliminar la categoría porque tiene productos asociados",
        409
      );
    }

    const result = await pool.query(
      "DELETE FROM categorias_productos WHERE id_categoria = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return handleError(res, "Categoría no encontrada", 404);
    }

    return res.json({
      mensaje: "Categoría eliminada correctamente",
      categoria: result.rows[0],
    });
  } catch (err) {
    return handleError(res, "Error al eliminar categoría", 500, err);
  }
};