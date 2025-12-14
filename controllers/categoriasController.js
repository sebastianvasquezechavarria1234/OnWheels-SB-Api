// controllers/categoriasController.js
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
      "SELECT * FROM categorias_eventos ORDER BY id_categoria_evento ASC"
    );
    return res.json(result.rows); // ✅ Sin clase
  } catch (err) {
    return handleError(res, "Error al obtener categorías", 500, err);
  }
};

export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM categorias_eventos WHERE id_categoria_evento = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return handleError(res, "Categoría no encontrada", 404);
    }

    return res.json(result.rows[0]); // ✅ Sin clase
  } catch (err) {
    return handleError(res, "Error al obtener la categoría", 500, err);
  }
};

export const createCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion } = req.body;

    // 1. Validaciones básicas
    if (!nombre_categoria || nombre_categoria.trim().length < 3) {
      return handleError(res, "El nombre debe tener mínimo 3 caracteres", 400);
    }
    if (nombre_categoria.trim().length > 50) {
      return handleError(res, "El nombre no puede exceder 50 caracteres", 400);
    }
    if (descripcion && descripcion.length > 200) {
      return handleError(res, "La descripción no puede exceder 200 caracteres", 400);
    }

    // 2. Validar duplicados (insensible a mayúsculas)
    const checkDuplicate = await pool.query(
      "SELECT id_categoria_evento FROM categorias_eventos WHERE LOWER(nombre_categoria) = LOWER($1)",
      [nombre_categoria.trim()]
    );

    if (checkDuplicate.rows.length > 0) {
      return handleError(res, "Ya existe una categoría con ese nombre", 409);
    }

    const result = await pool.query(
      `INSERT INTO categorias_eventos (nombre_categoria, descripcion)
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

    // 1. Validaciones básicas
    if (!nombre_categoria || nombre_categoria.trim().length < 3) {
      return handleError(res, "El nombre debe tener mínimo 3 caracteres", 400);
    }
    if (nombre_categoria.trim().length > 50) {
      return handleError(res, "El nombre no puede exceder 50 caracteres", 400);
    }
    if (descripcion && descripcion.length > 200) {
      return handleError(res, "La descripción no puede exceder 200 caracteres", 400);
    }

    // 2. Validar duplicados (excluyendo el actual)
    const checkDuplicate = await pool.query(
      "SELECT id_categoria_evento FROM categorias_eventos WHERE LOWER(nombre_categoria) = LOWER($1) AND id_categoria_evento != $2",
      [nombre_categoria.trim(), id]
    );

    if (checkDuplicate.rows.length > 0) {
       return handleError(res, "Ya existe otra categoría con ese nombre", 409);
    }

    const result = await pool.query(
      `UPDATE categorias_eventos
       SET nombre_categoria = $1,
           descripcion = $2
       WHERE id_categoria_evento = $3
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

    const usados = await pool.query(
      "SELECT COUNT(*) AS total FROM eventos WHERE id_categoria_evento = $1",
      [id]
    );

    if (Number(usados.rows[0].total) > 0) {
      return handleError(
        res,
        "No se puede eliminar la categoría porque tiene eventos asociados",
        409
      );
    }

    const result = await pool.query(
      "DELETE FROM categorias_eventos WHERE id_categoria_evento = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return handleError(res, "Categoría no encontrada", 404);
    }

    return res.json({
      mensaje: "Categoría eliminada correctamente",
      categoria: result.rows[0], // ✅ Sin clase
    });
  } catch (err) {
    return handleError(res, "Error al eliminar categoría", 500, err);
  }
};