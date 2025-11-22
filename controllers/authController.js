import { validationResult } from "express-validator"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import pool from "../db/postgresPool.js"

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

    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(contrasena, salt)

    // Insertar usuario con contraseña hasheada
    const insertUser = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, telefono, contrasena)
       VALUES ($1,$2,$3,$4)
       RETURNING id_usuario, nombre_completo, email`,
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
      token,
      user: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre_completo,
        email: newUser.email,
        rol: "cliente",
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
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre_completo,
        email: user.email,
        roles: roles.length > 0 ? roles : ["cliente"],
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Error en servidor", error: err.message })
  }
}
