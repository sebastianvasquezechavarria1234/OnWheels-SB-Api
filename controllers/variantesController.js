import pool from "../db/postgresPool.js";

// Obtener todas las variantes con su producto, color y talla
export const getVariantes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id_variante, 
             p.nombre AS producto,
             c.nombre AS color,
             t.nombre AS talla,
             v.stock
      FROM varianteproducto v
      INNER JOIN productos p ON v.id_producto = p.id_producto
      INNER JOIN color c ON v.id_color = c.id_color
      INNER JOIN talla t ON v.id_talla = t.id_talla
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
      `INSERT INTO varianteproducto (id_producto, id_color, id_talla, stock)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_producto, id_color, id_talla, stock]
    );
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
      `UPDATE varianteproducto
       SET id_color = $1, id_talla = $2, stock = $3
       WHERE id_variante = $4 RETURNING *`,
      [id_color, id_talla, stock, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar variante:", error);
    res.status(500).json({ error: "Error al actualizar la variante" });
  }
};

// Eliminar variante
export const deleteVariante = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM varianteproducto WHERE id_variante = $1", [id]);
    res.json({ mensaje: "Variante eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar variante:", error);
    res.status(500).json({ error: "Error al eliminar la variante" });
  }
};
