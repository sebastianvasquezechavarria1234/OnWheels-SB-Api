import { getPool } from "../db/postgresPool.js";
import Nivel from "../models/Nivel.js";

// ✅ Obtener todos los niveles
export const getNiveles = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query("SELECT * FROM NIVELES_CLASES ORDER BY id_nivel ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener niveles", error: error.message });
  }
};

// ✅ Obtener un nivel por ID
export const getNivelById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.query("SELECT * FROM NIVELES_CLASES WHERE id_nivel = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }

    const nivel = new Nivel(result.rows[0]);
    res.json(nivel);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener nivel", error: error.message });
  }
};

// ✅ Crear un nivel
export const createNivel = async (req, res) => {
  try {
    const { nombre_nivel, descripcion } = req.body;
    const pool = await getPool();

    const result = await pool.query(
      `INSERT INTO NIVELES_CLASES (nombre_nivel, descripcion)
       VALUES ($1, $2)
       RETURNING *`,
      [nombre_nivel, descripcion]
    );

    const nuevoNivel = new Nivel(result.rows[0]);
    res.status(201).json({ mensaje: "Nivel creado", nivel: nuevoNivel });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear nivel", error: error.message });
  }
};

// ✅ Actualizar un nivel
export const updateNivel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_nivel, descripcion } = req.body;

    const pool = await getPool();
    const result = await pool.query(
      `UPDATE NIVELES_CLASES
       SET nombre_nivel = $1, descripcion = $2
       WHERE id_nivel = $3
       RETURNING *`,
      [nombre_nivel, descripcion, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }

    res.json({ mensaje: "Nivel actualizado correctamente", nivel: result.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar nivel", error: error.message });
  }
};

// ✅ Eliminar un nivel
export const deleteNivel = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.query("DELETE FROM NIVELES_CLASES WHERE id_nivel = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }

    res.json({ mensaje: "Nivel eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar nivel", error: error.message });
  }
};
