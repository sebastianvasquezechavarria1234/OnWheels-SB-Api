// backend/controllers/authController.js
import { validationResult } from 'express-validator';
import pool from '../db/postgresPool.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '../services/emailService.js';

const saltRounds = 10;

// ==================== REGISTER ====================
export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, email, telefono, contrasena } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser llenados' });
    }

    const existing = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(contrasena, salt);

    const insertUser = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, telefono, contrasena)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre_completo, email`,
      [nombre, email.toLowerCase(), telefono || null, hashedPassword]
    );

    const newUser = insertUser.rows[0];

    // Asignar rol "cliente" por defecto
    try {
      const rolResult = await pool.query(
        `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = 'cliente' LIMIT 1`
      );
      if (rolResult.rows.length > 0) {
        await pool.query(
          `INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`,
          [newUser.id_usuario, rolResult.rows[0].id_rol]
        );
      }
    } catch (err) {
      console.log("No se pudo asignar rol por defecto:", err.message);
    }

    // ✅ Token LIMPIO: solo datos esenciales
    const token = jwt.sign(
      {
        id_usuario: newUser.id_usuario,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario creado correctamente',
      token,
      user: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre_completo,
        email: newUser.email
      }
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

    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];
    let passwordMatch = false;
    let needsMigration = false;

    if (user.contrasena.startsWith('$2')) {
      passwordMatch = await bcryptjs.compare(contrasena, user.contrasena);
    } else {
      passwordMatch = (user.contrasena === contrasena);
      needsMigration = true;
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (needsMigration) {
      const salt = await bcryptjs.genSalt(saltRounds);
      const newHashedPassword = await bcryptjs.hash(contrasena, salt);
      await pool.query(
        'UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2',
        [newHashedPassword, user.id_usuario]
      );
    }

    // ✅ Token LIMPIO: sin roles ni permisos
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre_completo,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error en servidor', error: err.message });
  }
}

// ==================== REQUEST PASSWORD RESET ====================
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Correo electrónico requerido' });
    }

    const userResult = await pool.query(
      'SELECT id_usuario, email FROM usuarios WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.json({ message: 'Si el correo existe, te llegará un enlace' });
    }

    const user = userResult.rows[0];
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 86400000);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
      [user.id_usuario, resetToken, expiresAt]
    );

    sendPasswordResetEmail(user.email, resetToken)
      .catch(err => console.error('Email error:', err));

    res.json({ message: "Revisa tu correo si la cuenta existe" });
  } catch (err) {
    console.error("Request reset error:", err);
    res.status(500).json({ message: "Error en servidor" });
  }
}

// ==================== RESET PASSWORD ====================
export async function resetPassword(req, res) {
  try {
    const { token, newPassword, email } = req.body;
    if (!token || !newPassword || !email) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const resetToken = tokenResult.rows[0];
    const userId = resetToken.user_id;

    const userResult = await pool.query(
      'SELECT email FROM usuarios WHERE id_usuario = $1',
      [userId]
    );

    if (userResult.rows[0].email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ message: "El email no coincide con el token" });
    }

    const salt = await bcryptjs.genSalt(saltRounds);
    const hash = await bcryptjs.hash(newPassword, salt);

    await pool.query(
      'UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2',
      [hash, userId]
    );

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Error en servidor" });
  }
}