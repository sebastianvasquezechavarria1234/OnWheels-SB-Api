// controllers/matriculasController.js
import {
  crearMatricula,
  obtenerMatriculas,
  obtenerMatriculaPorId,
  actualizarMatricula,
  eliminarMatricula,
  obtenerMatriculasPorEstudiante
} from "../models/matriculasModel.js";
import pool from "../db/postgresPool.js";

// Obtener matrículas del estudiante autenticado
export const getMisMatriculas = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const estQuery = "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $1";
    const estResult = await pool.query(estQuery, [id_usuario]);

    if (estResult.rowCount === 0) {
      return res.json([]);
    }

    const id_estudiante = estResult.rows[0].id_estudiante;
    const matriculas = await obtenerMatriculasPorEstudiante(id_estudiante);
    res.json(matriculas);
  } catch (err) {
    console.error("Error al obtener mis matrículas:", err);
    res.status(500).json({ mensaje: "Error al obtener tus matrículas" });
  }
};

// Crear matrícula
export const crear = async (req, res) => {
  try {
    const { id_estudiante, id_clase, id_plan } = req.body;
    if (!id_estudiante || !id_clase || !id_plan) {
      return res.status(400).json({
        mensaje: "id_estudiante, id_clase e id_plan son obligatorios",
      });
    }
    const nuevaMatricula = await crearMatricula(req.body);
    res.status(201).json({ mensaje: "Matrícula creada", matricula: nuevaMatricula });
  } catch (error) {
    console.error("Error al crear matrícula:", error);
    if (error.message.includes("no encontrado") || error.message.includes("activa")) {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al crear matrícula" });
  }
};

// Listar todas las matrículas (admin)
export const listar = async (req, res) => {
  try {
    const matriculas = await obtenerMatriculas();
    res.json(matriculas);
  } catch (error) {
    console.error("Error al listar matrículas:", error);
    res.status(500).json({ mensaje: "Error al listar matrículas" });
  }
};

// Obtener por ID
export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const matricula = await obtenerMatriculaPorId(id);
    if (!matricula) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.json(matricula);
  } catch (error) {
    console.error("Error al obtener matrícula:", error);
    res.status(500).json({ mensaje: "Error al obtener matrícula" });
  }
};

// Actualizar
export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaActualizada = await actualizarMatricula(id, req.body);
    if (!matriculaActualizada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.json({ mensaje: "Matrícula actualizada", matricula: matriculaActualizada });
  } catch (error) {
    console.error("Error al actualizar matrícula:", error);
    res.status(400).json({ mensaje: error.message || "Error al actualizar matrícula" });
  }
};

// Eliminar
export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaEliminada = await eliminarMatricula(id);
    if (!matriculaEliminada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.json({ mensaje: "Matrícula eliminada" });
  } catch (error) {
    console.error("Error al eliminar matrícula:", error);
    res.status(500).json({ mensaje: "Error al eliminar matrícula" });
  }
};

// ✅ NUEVA: Estudiantes activos del instructor
export const getEstudiantesDeInstructor = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const result = await pool.query(`
      SELECT DISTINCT
        e.id_estudiante,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.documento,
        n.nombre_nivel,
        c.id_clase,
        c.dia_semana,
        c.hora_inicio,
        m.estado
      FROM clases_instructores ci
      JOIN instructores i        ON ci.id_instructor = i.id_instructor
      JOIN usuarios u_inst       ON i.id_usuario = u_inst.id_usuario
      JOIN clases c              ON ci.id_clase = c.id_clase
      JOIN matriculas m          ON m.id_clase = c.id_clase
      JOIN estudiantes e         ON m.id_estudiante = e.id_estudiante
      JOIN usuarios u            ON e.id_usuario = u.id_usuario
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      WHERE u_inst.id_usuario = $1
        AND m.estado = 'Activa'
      ORDER BY u.nombre_completo ASC
    `, [id_usuario]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener estudiantes del instructor:", err);
    res.status(500).json({ mensaje: "Error al obtener estudiantes" });
  }
};
