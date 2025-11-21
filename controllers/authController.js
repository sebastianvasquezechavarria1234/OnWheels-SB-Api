// authController.js
import { validationResult } from 'express-validator';
import pool from '../db/postgresPool.js';

// ==================== REGISTER ====================
export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, email, telefono, contrasena } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser llenados' });
    }

    // Verificar si el email ya existe
    const existing = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    // Insertar usuario (con contrasena en texto plano)
    const insertUser = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, telefono, contrasena)
       VALUES ($1,$2,$3,$4)
       RETURNING id_usuario, nombre_completo, email`,
      [nombre, email.toLowerCase(), telefono || null, contrasena]
    );

    const newUser = insertUser.rows[0];
    
    // ASIGNAR ROL POR DEFECTO "Usuario" si existe, si no, continuar sin rol
    try {
      const rolResult = await pool.query(
        `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1) AND (estado IS NULL OR estado = true)`,
        ['Usuario']
      );

      if (rolResult.rows.length > 0) {
        const id_rol = rolResult.rows[0].id_rol;
        await pool.query(
          `INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`,
          [newUser.id_usuario, id_rol]
        );
      }
    } catch (rolError) {
      console.log('No se pudo asignar rol por defecto, pero el usuario fue creado:', rolError.message);
    }

    res.status(201).json({
      message: 'Usuario creado correctamente',
      user: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre_completo,
        email: newUser.email,
        rol: 'Usuario' // Asignamos por defecto para la respuesta
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Error en servidor', error: err.message });
  }
}

// ==================== LOGIN ====================
export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ message: 'Email y contrasena requeridos' });
    }

    // Buscar usuario
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // Comparación simple de contraseñas en texto plano
    if (user.contrasena !== contrasena) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Obtener el rol del usuario (puede ser null)
    let rol = null;
    try {
      const rolResult = await pool.query(`
        SELECT r.nombre_rol 
        FROM usuario_roles ur
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE ur.id_usuario = $1
        LIMIT 1
      `, [user.id_usuario]);

      if (rolResult.rows.length > 0) {
        rol = rolResult.rows[0].nombre_rol;
      }
    } catch (rolError) {
      console.log('Error al obtener rol, pero el login continúa:', rolError.message);
    }

    res.json({
      message: 'Login exitoso',
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre_completo,
        email: user.email,
        rol: rol // Puede ser "Administrador", "Usuario", "estudiante", "instructor" o null
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error en servidor', error: err.message });
  }
}