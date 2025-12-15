import Administrador from '../models/Administradores.js';
import db from '../db/postgresPool.js';

const administradorController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT a.*, u.nombre_completo, u.email
        FROM ADMINISTRADORES a
        JOIN USUARIOS u ON a.id_usuario = u.id_usuario
      `);
      const administradores = result.rows.map(row => new Administrador(row));
      res.status(200).json(administradores);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener administradores' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT a.*, u.nombre_completo, u.email
        FROM ADMINISTRADORES a
        JOIN USUARIOS u ON a.id_usuario = u.id_usuario
        WHERE a.id_admin = $1
      `, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Administrador no encontrado' });
      }
      const administrador = new Administrador(result.rows[0]);
      res.status(200).json(administrador);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener administrador' });
    }
  },

  create: async (req, res) => {
    try {
      const { id_usuario, tipo_admin, area } = req.body;
      const result = await db.query(
        'INSERT INTO ADMINISTRADORES(id_usuario, tipo_admin, area) VALUES($1, $2, $3) RETURNING *',
        [id_usuario, tipo_admin, area]
      );
      const administrador = new Administrador(result.rows[0]);
      res.status(201).json(administrador);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear administrador' });
    }
  },

  update: async (req, res) => {
    try {
      const { tipo_admin, area } = req.body;
      const result = await db.query(
        'UPDATE ADMINISTRADORES SET tipo_admin=$1, area=$2 WHERE id_admin=$3 RETURNING *',
        [tipo_admin, area, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Administrador no encontrado' });
      }
      const administrador = new Administrador(result.rows[0]);
      res.status(200).json(administrador);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar administrador' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await db.query('DELETE FROM ADMINISTRADORES WHERE id_admin = $1 RETURNING *', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Administrador no encontrado' });
      }
      const administrador = new Administrador(result.rows[0]);
      res.status(200).json(administrador);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al eliminar administrador' });
    }
  },
};

export default administradorController;