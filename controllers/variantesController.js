// controllers/variantesController.js
import pool from "../db/postgresPool.js";

// Obtener todas las variantes con su producto, ids, color (incl. codigo_hex) y talla
export const getVariantes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id_variante,
        v.id_producto,
        v.id_color,
        v.id_talla,
        v.stock,
        c.nombre_color,
        c.codigo_hex,
        t.nombre_talla
      FROM variantes_producto v
      LEFT JOIN colores c ON v.id_color = c.id_color
      LEFT JOIN tallas t ON v.id_talla = t.id_talla
      ORDER BY v.id_variante ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener variantes:", error);
    res.status(500).json({ error: "Error al obtener las variantes" });
  }
};

// Crear nueva variante
export const createVariante = async (req, res) => {
  const { id_producto, id_color, id_talla, stock } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO variantes_producto (id_producto, id_color, id_talla, stock)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_producto, id_color, id_talla, stock]
    );
    // opcional: devolver fila con nombres -> frontend recarga getVariantes de todos modos
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear variante:", error);
    res.status(500).json({ error: "Error al crear la variante" });
  }
};

// Actualizar una variante
export const updateVariante = async (req, res) => {
  const { id } = req.params;
  const { id_color, id_talla, stock } = req.body;
  try {
    const result = await pool.query(
      `UPDATE variantes_producto
       SET id_color = $1, id_talla = $2, stock = $3
       WHERE id_variante = $4 RETURNING *`,
      [id_color, id_talla, stock, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Variante no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar variante:", error);
    res.status(500).json({ error: "Error al actualizar la variante" });
  }
};

// Eliminar variante (SQL corregido: DELETE FROM ...)
export const deleteVariante = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM variantes_producto WHERE id_variante = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Variante no encontrada" });
    }
    res.json({ mensaje: "Variante eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar variante:", error);
    res.status(500).json({ error: "Error al eliminar la variante" });
  }
};
