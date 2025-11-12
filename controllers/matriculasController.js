import { getPool } from "../db/postgresPool.js";
import Matricula from "../models/Matricula.js";

// ✅ Obtener todas las matrículas (con datos de estudiante, clase y plan)
export const getMatriculas = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 
        m.*, 
        e.nombre_completo AS nombre_estudiante,
        c.descripcion AS descripcion_clase,
        p.nombre_plan AS nombre_plan
      FROM MATRICULAS m
      INNER JOIN ESTUDIANTES e ON m.id_estudiante = e.id_estudiante
      INNER JOIN CLASES c ON m.id_clase = c.id_clase
      INNER JOIN PLANES_CLASES p ON m.id_plan = p.id_plan
      ORDER BY m.fecha_matricula DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener matrículas", error: error.message });
  }
};

// ✅ Obtener matrícula por ID
export const getMatriculaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.query(
      `
      SELECT 
        m.*, 
        e.nombre_completo AS nombre_estudiante,
        c.descripcion AS descripcion_clase,
        p.nombre_plan AS nombre_plan
      FROM MATRICULAS m
      INNER JOIN ESTUDIANTES e ON m.id_estudiante = e.id_estudiante
      INNER JOIN CLASES c ON m.id_clase = c.id_clase
      INNER JOIN PLANES_CLASES p ON m.id_plan = p.id_plan
      WHERE m.id_matricula = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener matrícula", error: error.message });
  }
};

// ✅ Crear matrícula
export const createMatricula = async (req, res) => {
  try {
    const { id_estudiante, id_clase, id_plan, fecha_matricula, estado } = req.body;

    const pool = await getPool();
    const result = await pool.query(
      `
      INSERT INTO MATRICULAS (id_estudiante, id_clase, id_plan, fecha_matricula, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [id_estudiante, id_clase, id_plan, fecha_matricula || new Date(), estado || "Activa"]
    );

    const nuevaMatricula = new Matricula(result.rows[0]);
    res.status(201).json(nuevaMatricula);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear matrícula", error: error.message });
  }
};

// ✅ Actualizar matrícula
export const updateMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_estudiante, id_clase, id_plan, fecha_matricula, estado } = req.body;

    const pool = await getPool();
    const result = await pool.query(
      `
      UPDATE MATRICULAS
      SET 
        id_estudiante = $1,
        id_clase = $2,
        id_plan = $3,
        fecha_matricula = $4,
        estado = $5
      WHERE id_matricula = $6
      RETURNING *
      `,
      [id_estudiante, id_clase, id_plan, fecha_matricula, estado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }

    res.json({ mensaje: "Matrícula actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar matrícula", error: error.message });
  }
};

// ✅ Eliminar matrícula
export const deleteMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.query("DELETE FROM MATRICULAS WHERE id_matricula = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }

    res.json({ mensaje: "Matrícula eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar matrícula", error: error.message });
  }
};
