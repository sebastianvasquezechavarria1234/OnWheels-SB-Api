import pool from "../db/postgresPool.js";

// ✅ Crear color
export const createColor = async (req, res) => {
  try {
    const { nombre } = req.body;
    const result = await pool.query(
      "INSERT INTO colores (nombre) VALUES ($1) RETURNING *",
      [nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear color:", error);
    res.status(500).json({ error: "Error al crear color" });
  }
};

// ✅ Obtener todos los colores
export const getAllColors = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM colores");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener colores:", error);
    res.status(500).json({ error: "Error al obtener colores" });
  }
};
