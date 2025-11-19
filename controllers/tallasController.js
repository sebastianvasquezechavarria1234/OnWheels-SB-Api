import pool from "../db/postgresPool.js";

// ✅ Listar todas las tallas
export const listarTallas = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM talla ORDER BY id_talla ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al listar tallas:", error);
    res.status(500).json({ error: "Error al obtener las tallas" });
  }
};

// ✅ Crear una nueva talla
export const crearTalla = async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO talla (nombre) VALUES ($1) RETURNING *",
      [nombre]
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
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      "UPDATE talla SET nombre = $1 WHERE id_talla = $2 RETURNING *",
      [nombre, id]
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
    const result = await pool.query("DELETE FROM talla WHERE id_talla = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Talla no encontrada" });
    }
    res.json({ mensaje: "Talla eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar talla:", error);
    res.status(500).json({ error: "Error al eliminar la talla" });
  }
};
