// controllers/usuariosController.js
import Usuario from '../models/Usuarios.js';
import db from '../db/postgresPool.js';

const usuarioController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM USUARIOS');
      const usuarios = result.rows.map(row => new Usuario(row));
      res.status(200).json(usuarios);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  },

  getById: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM USUARIOS WHERE id_usuario = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const usuario = new Usuario(result.rows[0]);
      res.status(200).json(usuario);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener usuario' });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre_completo, email, telefono, fecha_nacimiento, contrasena } = req.body;
      const result = await db.query(
        'INSERT INTO USUARIOS(nombre_completo, email, telefono, fecha_nacimiento, contrasena) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [nombre_completo, email, telefono, fecha_nacimiento, contrasena]
      );
      const usuario = new Usuario(result.rows[0]);
      res.status(201).json(usuario);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al crear usuario' });
    }
  },

  update: async (req, res) => {
    try {
      const { nombre_completo, email, telefono, fecha_nacimiento, contrasena, estado } = req.body;
      const result = await db.query(
        'UPDATE USUARIOS SET nombre_completo=$1, email=$2, telefono=$3, fecha_nacimiento=$4, contrasena=$5, estado=$6 WHERE id_usuario=$7 RETURNING *',
        [nombre_completo, email, telefono, fecha_nacimiento, contrasena, estado, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const usuario = new Usuario(result.rows[0]);
      res.status(200).json(usuario);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await db.query('UPDATE USUARIOS SET estado = FALSE WHERE id_usuario = $1 RETURNING *', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const usuario = new Usuario(result.rows[0]);
      res.status(200).json(usuario);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  },
};

export default usuarioController;