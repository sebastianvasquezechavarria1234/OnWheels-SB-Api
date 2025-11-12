import pool from "../db/postgresPool.js";
import Patrocinador from "../models/Patrocinadores.js";

// ✅ Obtener todos los patrocinadores
export const getPatrocinadores = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query("SELECT * FROM PATROCINADORES ORDER BY nombre_patrocinador ASC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener patrocinadores", error: error.message });
  }
};

// ✅ Obtener patrocinador por ID
export const getPatrocinadorById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.query("SELECT * FROM PATROCINADORES WHERE id_patrocinador = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" });
    }

    const patrocinador = new Patrocinador(result.rows[0]);
    res.json(patrocinador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener patrocinador", error: error.message });
  }
};

// ✅ Crear patrocinador
export const createPatrocinador = async (req, res) => {
  try {
    const { nombre_patrocinador, email, telefono, logo_patrocinador } = req.body;
    const pool = await getPool();

    const result = await pool.query(
      `INSERT INTO PATROCINADORES (nombre_patrocinador, email, telefono, logo_patrocinador)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre_patrocinador, email, telefono, logo_patrocinador]
    );

    const nuevoPatrocinador = new Patrocinador(result.rows[0]);
    res.status(201).json(nuevoPatrocinador);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: "Error al crear patrocinador", error: error.message });
  }
};

// ✅ Actualizar patrocinador
export const updatePatrocinador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_patrocinador, email, telefono, logo_patrocinador } = req.body;
    const pool = await getPool();

    const result = await pool.query(
      `UPDATE PATROCINADORES
       SET nombre_patrocinador = $1,
           email = $2,
           telefono = $3,
           logo_patrocinador = $4
       WHERE id_patrocinador = $5
       RETURNING *`,
      [nombre_patrocinador, email, telefono, logo_patrocinador, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" });
    }

    res.json({ mensaje: "Patrocinador actualizado correctamente", patrocinador: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: "Error al actualizar patrocinador", error: error.message });
  }
};

// ✅ Eliminar patrocinador
export const deletePatrocinador = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.query("DELETE FROM PATROCINADORES WHERE id_patrocinador = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" });
    }

    res.json({ mensaje: "Patrocinador eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar patrocinador", error: error.message });
  }
};
