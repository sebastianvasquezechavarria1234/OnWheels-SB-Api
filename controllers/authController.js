// controllers/authController.js
import dotenv from 'dotenv';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../db/postgresPool.js';

dotenv.config();

function signToken(payloadObj) {
  return jwt.sign(payloadObj, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, email, telefono, password } = req.body;
    if (!nombre || !email || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const pool = await getPool();

    // Verificar existencia por email (normalizamos a lowercase)
    const check = await pool.request()
      .input('Email', sql.NVarChar, email.toLowerCase())
      .query('SELECT TOP 1 * FROM Usuarios WHERE Email = @Email');

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Insertar usuario (ajusta nombres de columnas si tu tabla usa distintos)
    const insertResult = await pool.request()
      .input('Nombre', sql.NVarChar, nombre)
      .input('Email', sql.NVarChar, email.toLowerCase())
      .input('Telefono', sql.NVarChar, telefono)
      .input('Password', sql.NVarChar, hashed)
      .query(`
        INSERT INTO Usuarios (nombre_completo, Email, telefono, contraseña, CreatedAt)
        VALUES (@Nombre, @Email, @Telefono, @Password, GETDATE());
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
      `);

    const newId = insertResult.recordset?.[0]?.id ?? null;

    // Opcional: crear token inmediatamente
    const token = signToken({ id: newId, email: email.toLowerCase() });

    res.status(201).json({
      message: 'Usuario creado',
      user: { id: newId, nombre, email: email.toLowerCase() },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Error en servidor' });
  }
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

    const pool = await getPool();
    const result = await pool.request()
      .input('Email', sql.NVarChar, email.toLowerCase())
      .query('SELECT TOP 1 * FROM Usuarios WHERE Email = @Email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];
    // Nota: campo de contraseña en la tabla lo he dejado como "contraseña" porque tu modelo JS lo usa así.
    // Si en la BD tu columna se llama diferente (p.e. Password, password, Contrasena) ajusta aquí.
    const hashedPassword = user['contraseña'] ?? user['password'] ?? user['Password'];

    if (!hashedPassword) {
      console.error('Campo contraseña no encontrado en user:', Object.keys(user));
      return res.status(500).json({ message: 'Configuración de usuarios incorrecta' });
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

    const payload = { id: user.id_usuario ?? user.Id ?? user.ID ?? user.id, email: user.Email ?? user.email };
    const token = signToken(payload);

    res.json({
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: {
        id: payload.id,
        email: payload.email,
        nombre: user.nombre_completo ?? user.Nombre ?? user.nombre
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error en servidor' });
  }
}
