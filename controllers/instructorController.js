import db from '../db/postgresPool.js';

const instructorController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT i.*, u.nombre_completo, u.email
        FROM INSTRUCTORES i
        JOIN USUARIOS u ON i.id_usuario = u.id_usuario
      `);
      const instructores = result.rows.map(row => new Instructor(row));
      res.status(200).json(instructores);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener instructores' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT i.*, u.nombre_completo, u.email
        FROM INSTRUCTORES i
        JOIN USUARIOS u ON i.id_usuario = u.id_usuario
        WHERE i.id_instructor = $1
      `, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }
      const instructor = new Instructor(result.rows[0]);
      res.status(200).json(instructor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener instructor' });
    }
  },

  create: async (req, res) => {
    try {
      const { id_usuario, documento, tipo_documento, anios_experiencia, especialidad } = req.body;
      const result = await db.query(
        'INSERT INTO INSTRUCTORES(id_usuario, documento, tipo_documento, anios_experiencia, especialidad) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [id_usuario, documento, tipo_documento, anios_experiencia, especialidad]
      );
      const instructor = new Instructor(result.rows[0]);
      res.status(201).json(instructor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear instructor' });
    }
  },

  update: async (req, res) => {
    try {
      const { documento, tipo_documento, anios_experiencia, especialidad, estado } = req.body;
      const result = await db.query(
        'UPDATE INSTRUCTORES SET documento=$1, tipo_documento=$2, anios_experiencia=$3, especialidad=$4, estado=$5 WHERE id_instructor=$6 RETURNING *',
        [documento, tipo_documento, anios_experiencia, especialidad, estado, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }
      const instructor = new Instructor(result.rows[0]);
      res.status(200).json(instructor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar instructor' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await db.query('UPDATE INSTRUCTORES SET estado = FALSE WHERE id_instructor = $1 RETURNING *', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Instructor no encontrado' });
      }
      const instructor = new Instructor(result.rows[0]);
      res.status(200).json(instructor);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al eliminar instructor' });
    }
  },
};

export default instructorController;