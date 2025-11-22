<<<<<<< HEAD
// backend/controllers/authController.js
import { validationResult } from 'express-validator';
import pool from '../db/postgresPool.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Configuración de bcrypt
const saltRounds = 10;
=======
import { validationResult } from "express-validator"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import pool from "../db/postgresPool.js"
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde

// ==================== REGISTER ====================
export async function register(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const { nombre, email, telefono, contrasena } = req.body

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben ser llenados" })
    }

    // Verificar si el email ya existe
    const existing = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email ya registrado" })
    }

<<<<<<< HEAD
    // ✅ ENCRIPTAR CONTRASEÑA CON BCRYPT
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Insertar usuario con contraseña encriptada
=======
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(contrasena, salt)

    // Insertar usuario con contraseña hasheada
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde
    const insertUser = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, telefono, contrasena)
       VALUES ($1,$2,$3,$4)
       RETURNING id_usuario, nombre_completo, email`,
<<<<<<< HEAD
      [nombre, email.toLowerCase(), telefono || null, hashedPassword]
    );

    const newUser = insertUser.rows[0];
    
    // ASIGNAR ROL POR DEFECTO "Usuario"
    let id_rol;
    const rolResult = await pool.query(
      `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1) AND (estado IS NULL OR estado = true)`,
      ['Usuario']
    );

    if (rolResult.rows.length === 0) {
      // Crear rol "Usuario" si no existe
      const createRol = await pool.query(
        `INSERT INTO roles (nombre_rol, descripcion, estado) 
         VALUES ($1, $2, $3) 
         RETURNING id_rol`,
        ['Usuario', 'Rol por defecto para usuarios registrados', true]
      );
      id_rol = createRol.rows[0].id_rol;
    } else {
      id_rol = rolResult.rows[0].id_rol;
    }

    // Asignar el rol al usuario
    await pool.query(
      `INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`,
      [newUser.id_usuario, id_rol]
    );

    // ✅ GENERAR TOKEN JWT
    const token = jwt.sign(
      {
        id: newUser.id_usuario,
        email: newUser.email,
        rol: 'Usuario'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(201).json({
      message: 'Usuario creado correctamente',
=======
      [nombre, email.toLowerCase(), telefono || null, hashedPassword],
    )

    const newUser = insertUser.rows[0]

    try {
      const rolResult = await pool.query(
        `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1) AND (estado IS NULL OR estado = true)`,
        ["cliente"],
      )

      if (rolResult.rows.length > 0) {
        const id_rol = rolResult.rows[0].id_rol
        await pool.query(`INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`, [newUser.id_usuario, id_rol])
      }
    } catch (rolError) {
      console.log("No se pudo asignar rol por defecto, pero el usuario fue creado:", rolError.message)
    }

    const token = jwt.sign({ id_usuario: newUser.id_usuario, email: newUser.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    res.status(201).json({
      message: "Usuario creado correctamente",
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde
      token,
      user: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre_completo,
        email: newUser.email,
<<<<<<< HEAD
        rol: 'Usuario'
=======
        rol: "cliente",
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde
      },
    })
  } catch (err) {
    console.error("Register error:", err)
    res.status(500).json({ message: "Error en servidor", error: err.message })
  }
}

// ==================== LOGIN ====================
export async function login(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const { email, contrasena } = req.body

    if (!email || !contrasena) {
      return res.status(400).json({ message: "Email y contrasena requeridos" })
    }

    // Buscar usuario
    const userResult = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email.toLowerCase()])

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" })
    }

    const user = userResult.rows[0]

<<<<<<< HEAD
    // ✅ LÓGICA DE MIGRACIÓN: Verificar si la contraseña está encriptada o en texto plano
    let passwordMatch = false;
    let needsMigration = false;

    // Verificar si la contraseña parece estar encriptada (longitud típica de bcrypt)
    if (user.contrasena.startsWith('$2a$') || user.contrasena.startsWith('$2b$') || user.contrasena.startsWith('$2y$')) {
      // Es una contraseña bcrypt, comparar normalmente
      passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
    } else {
      // Es una contraseña en texto plano (legado)
      passwordMatch = (user.contrasena === contrasena);
      needsMigration = true; // Marcar para migrar después del login exitoso
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // ✅ MIGRAR CONTRASEÑA A BCRYPT SI ESTÁ EN TEXTO PLANO
    if (needsMigration) {
      const newHashedPassword = await bcrypt.hash(contrasena, saltRounds);
      await pool.query(
        'UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2',
        [newHashedPassword, user.id_usuario]
      );
      console.log(`Contraseña del usuario ${user.id_usuario} migrada a bcrypt`);
    }

    // Obtener el rol del usuario
    let rol = null;
    const rolResult = await pool.query(`
      SELECT r.nombre_rol 
      FROM usuario_roles ur
      JOIN roles r ON ur.id_rol = r.id_rol
      WHERE ur.id_usuario = $1
      LIMIT 1
    `, [user.id_usuario]);

    if (rolResult.rows.length > 0) {
      rol = rolResult.rows[0].nombre_rol;
    } else {
      // Si no tiene rol asignado, asignar "Usuario" por defecto
      rol = 'Usuario';
      
      // Buscar o crear el rol "Usuario"
      const defaultRol = await pool.query(
        `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1)`,
        ['Usuario']
      );
      
      if (defaultRol.rows.length > 0) {
        const id_rol = defaultRol.rows[0].id_rol;
        await pool.query(
          `INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`,
          [user.id_usuario, id_rol]
        );
      }
    }

    // ✅ GENERAR TOKEN JWT CON ROL
    const token = jwt.sign(
      {
        id: user.id_usuario,
        email: user.email,
        rol: rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({
      message: 'Login exitoso',
=======
    const isValidPassword = await bcryptjs.compare(contrasena, user.contrasena)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" })
    }

    let roles = []
    try {
      const rolesResult = await pool.query(
        `
        SELECT r.id_rol, r.nombre_rol 
        FROM usuario_roles ur
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE ur.id_usuario = $1
      `,
        [user.id_usuario],
      )

      roles = rolesResult.rows.map((r) => r.nombre_rol)
    } catch (roleError) {
      console.log("Error al obtener roles:", roleError.message)
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        roles: roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    )

    res.json({
      message: "Login exitoso",
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre_completo,
        email: user.email,
<<<<<<< HEAD
        rol: rol
=======
        roles: roles.length > 0 ? roles : ["cliente"],
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Error en servidor", error: err.message })
  }
}
<<<<<<< HEAD

// ==================== REQUEST PASSWORD RESET ====================
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Correo electrónico requerido' });
    }

    // Buscar usuario (no revelar si existe o no por seguridad)
    const userResult = await pool.query(
      'SELECT id_usuario, email FROM usuarios WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    // Siempre responder igual (para no revelar usuarios existentes)
    if (userResult.rows.length === 0) {
      return res.json({ 
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña' 
      });
    }

    const user = userResult.rows[0];
    
    // Generar token único y expirable (1 hora)
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id) DO UPDATE 
       SET token = $2, expires_at = $3`,
      [user.id_usuario, resetToken, expiresAt]
    );

    // Enviar email (en background)
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
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar token
    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const resetToken = tokenResult.rows[0];
    const userId = resetToken.user_id;

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

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

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
}
=======
>>>>>>> bf308117671338ed69a9a35b014245ffbcd4bfde
