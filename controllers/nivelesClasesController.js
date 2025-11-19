// controllers/nivelesController.js
import pool from "../db/postgresPool.js";

// Obtener todos los niveles
export const obtenerNiveles = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM niveles");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los niveles" });
  }
};

// Obtener un nivel por ID
export const obtenerNivelPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM niveles WHERE id_nivel = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el nivel" });
  }
};

// Crear un nuevo nivel
export const crearNivel = async (req, res) => {
  const { nombre_nivel, descripcion } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO niveles (nombre_nivel, descripcion) VALUES ($1, $2) RETURNING *",
      [nombre_nivel, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el nivel" });
  }
};

// Actualizar un nivel
export const actualizarNivel = async (req, res) => {
  const { id } = req.params;
  const { nombre_nivel, descripcion } = req.body;
  try {
    const result = await pool.query(
      "UPDATE niveles SET nombre_nivel = $1, descripcion = $2 WHERE id_nivel = $3 RETURNING *",
      [nombre_nivel, descripcion, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el nivel" });
  }
};

// Eliminar un nivel
export const eliminarNivel = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM niveles WHERE id_nivel = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }
    res.json({ mensaje: "Nivel eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el nivel" });
  }
};
