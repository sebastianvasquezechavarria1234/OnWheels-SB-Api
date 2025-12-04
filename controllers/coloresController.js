// controllers/coloresController.js
import pool from "../db/postgresPool.js";

// Obtener todos los colores
export const getColores = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM colores ORDER BY id_color ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener colores:", error);
    res.status(500).json({ error: "Error al obtener los colores" });
  }
};

// Crear un nuevo color — SIN ON CONFLICT
export const createColor = async (req, res) => {
  const { nombre_color, codigo_hex } = req.body;

  // Validación
  if (!nombre_color || typeof nombre_color !== 'string' || nombre_color.trim() === '') {
    return res.status(400).json({ error: "El campo 'nombre_color' es obligatorio." });
  }

  const nombreLimpio = nombre_color.trim();
  const hexLimpio = codigo_hex ? codigo_hex.trim() : null;

  try {
    // ✅ Primero: verificar si YA EXISTE por nombre_color (único)
    const existing = await pool.query(
      "SELECT * FROM colores WHERE nombre_color = $1",
      [nombreLimpio]
    );

    if (existing.rows.length > 0) {
      // Si existe, devolverlo (comportamiento de "idempotencia")
      return res.status(200).json(existing.rows[0]);
    }

    // ✅ Segundo: insertar nuevo color
    const result = await pool.query(
      "INSERT INTO colores (nombre_color, codigo_hex) VALUES ($1, $2) RETURNING *",
      [nombreLimpio, hexLimpio]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("❌ Error real al crear color:", error);

    // Si por alguna razón falla por duplicado (aunque no debería)
    if (error.code === '23505') {
      return res.status(400).json({ error: `El color "${nombre_color}" ya existe.` });
    }

    return res.status(500).json({ error: "Error al crear el color" });
  }
};

// Actualizar color
export const updateColor = async (req, res) => {
  const { id } = req.params;
  const { nombre_color, codigo_hex } = req.body;

  if (!nombre_color) {
    return res.status(400).json({ error: "El campo 'nombre_color' es obligatorio." });
  }

  try {
    const result = await pool.query(
      "UPDATE colores SET nombre_color = $1, codigo_hex = $2 WHERE id_color = $3 RETURNING *",
      [nombre_color.trim(), codigo_hex || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Color no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar color:", error);
    res.status(500).json({ error: "Error al actualizar el color" });
  }
};

// Eliminar color
export const deleteColor = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM colores WHERE id_color = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Color no encontrado" });
    }
    res.json({ mensaje: "Color eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar color:", error);
    res.status(500).json({ error: "Error al eliminar el color" });
  }
};