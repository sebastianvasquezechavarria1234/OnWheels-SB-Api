import Estudiante from '../models/Estudiante.js';
import db from '../db/postgresPool.js';

const estudianteController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT e.*, u.nombre_completo, u.email
        FROM ESTUDIANTES e
        JOIN USUARIOS u ON e.id_usuario = u.id_usuario
      `);
      const estudiantes = result.rows.map(row => new Estudiante(row));
      res.status(200).json(estudiantes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener estudiantes' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT e.*, u.nombre_completo, u.email
        FROM ESTUDIANTES e
        JOIN USUARIOS u ON e.id_usuario = u.id_usuario
        WHERE e.id_estudiante = $1
      `, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }
      const estudiante = new Estudiante(result.rows[0]);
      res.status(200).json(estudiante);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener estudiante' });
    }
  },

  create: async (req, res) => {
    try {
      const { id_usuario, documento, tipo_documento, estado, enfermedad, nivel_experiencia, edad, id_acudiente } = req.body;
      const result = await db.query(
        'INSERT INTO ESTUDIANTES(id_usuario, documento, tipo_documento, estado, enfermedad, nivel_experiencia, edad, id_acudiente) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id_usuario, documento, tipo_documento, estado, enfermedad, nivel_experiencia, edad, id_acudiente]
      );
      const estudiante = new Estudiante(result.rows[0]);
      res.status(201).json(estudiante);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear estudiante' });
    }
  },

  update: async (req, res) => {
    try {
      const { documento, tipo_documento, estado, enfermedad, nivel_experiencia, edad, id_acudiente } = req.body;
      const result = await db.query(
        'UPDATE ESTUDIANTES SET documento=$1, tipo_documento=$2, estado=$3, enfermedad=$4, nivel_experiencia=$5, edad=$6, id_acudiente=$7 WHERE id_estudiante=$8 RETURNING *',
        [documento, tipo_documento, estado, enfermedad, nivel_experiencia, edad, id_acudiente, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }
      const estudiante = new Estudiante(result.rows[0]);
      res.status(200).json(estudiante);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar estudiante' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await db.query('DELETE FROM ESTUDIANTES WHERE id_estudiante = $1 RETURNING *', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }
      const estudiante = new Estudiante(result.rows[0]);
      res.status(200).json(estudiante);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al eliminar estudiante' });
    }
  },
};

export default estudianteController;
=======
import {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  actualizarEstudiante,
  eliminarEstudiante,
  obtenerPreinscripcionesPendientes,
  actualizarEstadoPreinscripcion
} from "../models/estudiantesModel.js";

export const crear = async (req, res) => {
  try {
    // Validaciones básicas
    const { id_usuario } = req.body;
    if (!id_usuario) {
      return res.status(400).json({ mensaje: "id_usuario es obligatorio" });
    }

    const nuevoEstudiante = await crearEstudiante(req.body);
    res.status(201).json({
      mensaje: "Estudiante creado correctamente",
      estudiante: nuevoEstudiante
    });
  } catch (error) {
    console.error("Error al crear estudiante:", error);
    if (error.message.includes("Usuario no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al crear estudiante" });
  }
};

export const listar = async (req, res) => {
  try {
    const estudiantes = await obtenerEstudiantes();
    res.status(200).json(estudiantes);
  } catch (error) {
    console.error("Error al listar estudiantes:", error);
    res.status(500).json({ mensaje: "Error al listar estudiantes" });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const estudiante = await obtenerEstudiantePorId(id);
    if (!estudiante) {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }
    // Solo mostrar estudiantes activos en el CRUD normal
    if (estudiante.estado !== 'Activo') {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }
    res.status(200).json(estudiante);
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    res.status(500).json({ mensaje: "Error al obtener estudiante" });
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteActualizado = await actualizarEstudiante(id, req.body);
    if (!estudianteActualizado) {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }
    res.status(200).json({
      mensaje: "Estudiante actualizado correctamente",
      estudiante: estudianteActualizado
    });
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    if (error.message.includes("Acudiente no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al actualizar estudiante" });
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteEliminado = await eliminarEstudiante(id);
    if (!estudianteEliminado) {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }
    res.status(200).json({ mensaje: "Estudiante eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res.status(500).json({ mensaje: "Error al eliminar estudiante" });
  }
};

// Endpoint
