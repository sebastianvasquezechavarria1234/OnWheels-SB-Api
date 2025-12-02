// backend/controllers/authController.js
import { validationResult } from 'express-validator';
import pool from '../db/postgresPool.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Configuración de bcrypt
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

    // Verificar si el email ya existe
    const existing = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    // ✅ ENCRIPTAR CONTRASEÑA CON BCRYPT
    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(contrasena, salt);

    // Insertar usuario con contraseña encriptada
    const insertUser = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, telefono, contrasena)
       VALUES ($1,$2,$3,$4)
       RETURNING id_usuario, nombre_completo, email`,
      [nombre, email.toLowerCase(), telefono || null, hashedPassword]
    );

    const newUser = insertUser.rows[0];
    
    // ASIGNAR ROL POR DEFECTO "cliente"
    try {
      const rolResult = await pool.query(
        `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1) AND (estado IS NULL OR estado = true)`,
        ['cliente']
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

    // ✅ GENERAR TOKEN JWT
    const token = jwt.sign(
      {
        id_usuario: newUser.id_usuario,
        email: newUser.email,
        roles: ['cliente']
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Usuario creado correctamente',
      token,
      user: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre_completo,
        email: newUser.email,
        rol: 'cliente'
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

    // ✅ LÓGICA DE MIGRACIÓN
    let passwordMatch = false;
    let needsMigration = false;

    if (user.contrasena.startsWith('$2a$') || user.contrasena.startsWith('$2b$') || user.contrasena.startsWith('$2y$')) {
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
      console.log(`✅ Contraseña del usuario ${user.id_usuario} migrada a bcrypt`);
    }

    // Obtener el rol del usuario
    let roles = [];
    try {
      const rolesResult = await pool.query(
        `SELECT r.nombre_rol 
         FROM usuario_roles ur
         JOIN roles r ON ur.id_rol = r.id_rol
         WHERE ur.id_usuario = $1`,
        [user.id_usuario]
      );

      if (rolesResult.rows.length > 0) {
        roles = rolesResult.rows.map(r => r.nombre_rol.toLowerCase());
      } else {
        roles = ['cliente'];
        
        const defaultRol = await pool.query(
          `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = 'cliente' LIMIT 1`
        );
        
        if (defaultRol.rows.length > 0) {
          await pool.query(
            `INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`,
            [user.id_usuario, defaultRol.rows[0].id_rol]
          );
        }
      }
    } catch (roleError) {
      console.log('Error al obtener roles:', roleError.message);
      roles = ['cliente'];
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        roles: roles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre_completo,
        email: user.email,
        roles: roles
      },
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
      return res.json({ 
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña' 
      });
    }

    const user = userResult.rows[0];
    
    // Generar token único y expirable (24 horas para pruebas)
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 86400000); // 24 horas

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id) DO UPDATE 
       SET token = $2, expires_at = $3`,
      [user.id_usuario, resetToken, expiresAt]
    );

    console.log('📧 Enviando email de recuperación a:', user.email);
    console.log('🔍 Token generado:', resetToken);
    console.log('⏰ Expira en:', expiresAt.toString());

    sendPasswordResetEmail(user.email, resetToken)
      .catch(err => console.error('Error en background email:', err));

    res.json({ 
      message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña' 
    });
  } catch (err) {
    console.error('Request password reset error:', err);
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
}

// ==================== RESET PASSWORD ====================
export async function resetPassword(req, res) {
  try {
    const { token, newPassword, email } = req.body;
    
    console.log('🔍 Debug reset password - Request body:', {
      token,
      email,
      newPassword: newPassword ? '*'.repeat(newPassword.length) : 'no proporcionado'
    });

    if (!token || !newPassword || !email) {
      console.log('❌ Error: Faltan parámetros requeridos');
      return res.status(400).json({ message: 'Token, contraseña y email son requeridos' });
    }

    if (newPassword.length < 6) {
      console.log('❌ Error: Contraseña demasiado corta');
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar token
    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      console.log('❌ Error: Token no válido o expirado');
      console.log('🔍 Tokens existentes en DB:', await pool.query(
        `SELECT token, expires_at FROM password_reset_tokens WHERE token = $1`,
        [token]
      ));
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const resetToken = tokenResult.rows[0];
    const userId = resetToken.user_id;

    // Verificar que el email coincide con el usuario
    const userResult = await pool.query(
      'SELECT email FROM usuarios WHERE id_usuario = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Error: Usuario no encontrado');
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const userEmail = userResult.rows[0].email.toLowerCase();
    const providedEmail = email.toLowerCase();
    
    console.log('🔍 Comparando emails:');
    console.log('📧 Email en DB:', userEmail);
    console.log('📧 Email proporcionado:', providedEmail);
    console.log('✅ ¿Coinciden?:', userEmail === providedEmail);

    if (userEmail !== providedEmail) {
      console.log('❌ Error: El email no coincide con el token');
      return res.status(400).json({ message: 'El email no coincide con el token' });
    }

    // Encriptar nueva contraseña
    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    // Actualizar contraseña
    await pool.query(
      'UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2',
      [hashedPassword, userId]
    );

    // Eliminar token usado
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [userId]
    );

    console.log(`✅ Contraseña actualizada para usuario ${userId}`);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('❌ Reset password error detallado:', err);
    console.error('❌ Stack trace:', err.stack);
    
    let errorMessage = 'Error en el servidor';
    if (err.message) {
      errorMessage = err.message.includes('connect') ? 
        'No se pudo conectar a la base de datos' : err.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      token: req.body.token,
      email: req.body.email
    });
  }
}