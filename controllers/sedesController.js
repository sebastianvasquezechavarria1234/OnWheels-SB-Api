// controllers/sedesController.js
import pool from "../db/postgresPool.js";
import Sede from "../models/Sedes.js";

// ✅ Obtener todas las sedes
export const getSedes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM sedes 
      ORDER BY nombre_sede ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener sedes",
      error: error.message,
    });
  }
};

// ✅ Obtener sede por ID
export const getSedeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM sedes WHERE id_sede = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener sede",
      error: error.message,
    });
  }
};

// ✅ Crear sede
export const createSede = async (req, res) => {
  try {
    const { nombre_sede, direccion, ciudad, telefono } = req.body;

    const result = await pool.query(
      `
      INSERT INTO sedes (nombre_sede, direccion, ciudad, telefono)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nombre_sede, direccion, ciudad, telefono]
    );

    const nuevaSede = new Sede(result.rows[0]);
    res.status(201).json(nuevaSede);
  } catch (error) {
    res.status(400).json({
      mensaje: "Error al crear sede",
      error: error.message,
    });
  }
};

// ✅ Actualizar sede
export const updateSede = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_sede, direccion, ciudad, telefono } = req.body;

    const result = await pool.query(
      `
      UPDATE sedes
      SET nombre_sede = $1,
          direccion = $2,
          ciudad = $3,
          telefono = $4
      WHERE id_sede = $5
      RETURNING *
      `,
      [nombre_sede, direccion, ciudad, telefono, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" });
    }

    res.json({
      mensaje: "Sede actualizada correctamente",
      sede: new Sede(result.rows[0]),
    });
  } catch (error) {
    res.status(400).json({
      mensaje: "Error al actualizar sede",
      error: error.message,
    });
  }
};

// ✅ Eliminar sede
export const deleteSede = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM sedes WHERE id_sede = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" });
    }

    res.json({ mensaje: "Sede eliminada correctamente" });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar sede",
      error: error.message,
    });
  }
};
