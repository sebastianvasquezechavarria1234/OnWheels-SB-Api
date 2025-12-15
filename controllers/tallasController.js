// controllers/tallasController.js
import pool from "../db/postgresPool.js";

// ✅ Listar todas las tallas
export const listarTallas = async (req, res) => {
  try {
    // Cambiado: 'talla' por 'TALLAS' (según tu esquema)
    const result = await pool.query("SELECT * FROM tallas ORDER BY id_talla ASC"); // nombre_talla correcto de la tabla
    res.json(result.rows);
  } catch (error) {
    console.error("Error al listar tallas:", error);
    res.status(500).json({ error: "Error al obtener las tallas" });
  }
};

export const crearTalla = async (req, res) => {
  const { nombre_talla } = req.body;

  // 🔍 Validación robusta
  if (!nombre_talla || typeof nombre_talla !== 'string' || nombre_talla.trim() === '') {
    return res.status(400).json({
      error: "El campo 'nombre' es obligatorio, debe ser una cadena no vacía."
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO tallas (nombre_talla) VALUES ($1) RETURNING *",
      [nombre_talla.trim()] // Limpia espacios innecesarios
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear talla:", error);
    res.status(500).json({ error: "Error al crear la talla" });
  }
};

// ✅ Actualizar una talla
export const actualizarTalla = async (req, res) => {
  const { id } = req.params;
  const { nombre_talla } = req.body; // req.body.nombre sigue siendo el nombre del campo enviado por el frontend
  try {
    // Cambiado: 'talla' por 'TALLAS' y 'nombre' por 'nombre_talla' (según tu esquema)
    const result = await pool.query(
      "UPDATE tallas SET nombre_talla = $1 WHERE id_talla = $2 RETURNING *", // Columna correcta
      [nombre_talla, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Talla no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar talla:", error);
    res.status(500).json({ error: "Error al actualizar la talla" });
  }
};

// ✅ Eliminar una talla
export const eliminarTalla = async (req, res) => {
  const { id } = req.params;
  try {
    // Cambiado: 'talla' por 'TALLAS' (según tu esquema)
    const result = await pool.query("DELETE FROM tallas WHERE id_talla = $1", [id]); // nombre_talla correcto de la tabla
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Talla no encontrada" });
    }
    res.json({ mensaje: "Talla eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar talla:", error);
    res.status(500).json({ error: "Error al eliminar la talla" });
  }
};