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