// controllers/usuariosController.js
import pool from "../db/postgresPool.js"
import Usuario from "../models/Usuarios.js"

// ✅ Obtener todos los usuarios con su rol
export const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.*, 
             (SELECT r.nombre_rol 
              FROM usuario_roles ur 
              JOIN roles r ON ur.id_rol = r.id_rol 
              WHERE ur.id_usuario = u.id_usuario) as rol
      FROM usuarios u 
      ORDER BY u.nombre_completo ASC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuarios" })
  }
}

// ✅ Obtener usuario por ID con su rol
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(`
      SELECT u.*, 
             (SELECT r.nombre_rol 
              FROM usuario_roles ur 
              JOIN roles r ON ur.id_rol = r.id_rol 
              WHERE ur.id_usuario = u.id_usuario) as rol
      FROM usuarios u 
      WHERE u.id_usuario = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuario" })
  }
}

// ✅ Verificar si email existe
export const verificarEmail = async (req, res) => {
  try {
    const { email } = req.params
    const result = await pool.query(`
      SELECT u.*, 
             (SELECT r.nombre_rol 
              FROM usuario_roles ur 
              JOIN roles r ON ur.id_rol = r.id_rol 
              WHERE ur.id_usuario = u.id_usuario) as rol
      FROM usuarios u 
      WHERE u.email = $1
    `, [email])

    if (result.rows.length > 0) {
      return res.json({ existe: true, usuario: result.rows[0] })
    }
    res.json({ existe: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al verificar email" })
  }
}

// ✅ Crear usuario con rol (contraseña en texto plano)
export const createUsuario = async (req, res) => {
  try {
    const {
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
      fecha_nacimiento,
      contrasena, // <- SE GUARDARÁ TAL CUAL
      rol
    } = req.body

    // 1️⃣ Crear usuario
    const result = await pool.query(
      `INSERT INTO usuarios 
      (documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, contrasena)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id_usuario`,
      [
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        fecha_nacimiento,
        contrasena
      ]
    )

    const id_usuario = result.rows[0].id_usuario

    // 2️⃣ Buscar el id del rol por su nombre
    const rolResult = await pool.query(
      `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1)`,
      [rol]
    )

    if (rolResult.rows.length === 0) {
      return res.status(400).json({ mensaje: `El rol '${rol}' no existe en la base de datos` })
    }

    const id_rol = rolResult.rows[0].id_rol

    // 3️⃣ Asignar el rol al usuario
    await pool.query(
      `INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`,
      [id_usuario, id_rol]
    )

    // 4️⃣ Devolver respuesta con el rol incluido
    res.status(201).json({
      mensaje: `Usuario creado correctamente con el rol '${rol}' asignado`,
      usuario: {
        id_usuario,
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        fecha_nacimiento,
        contrasena, // <- CONTRASEÑA EN TEXTO PLANO
        rol
      }
    })
  } catch (err) {
    console.error("Error en transacción:", err)
    res.status(400).json({ mensaje: "Error al crear usuario", error: err.message })
  }
}

// ✅ Actualizar usuario (contraseña en texto plano)
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const {
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
      fecha_nacimiento,
      contrasena // <- SE ACTUALIZA TAL CUAL
    } = req.body

    const result = await pool.query(
      `UPDATE usuarios
       SET documento = $1,
           tipo_documento = $2,
           nombre_completo = $3,
           email = $4,
           telefono = $5,
           fecha_nacimiento = $6,
           contrasena = $7
       WHERE id_usuario = $8`,
      [
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        fecha_nacimiento,
        contrasena,
        id
      ]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario actualizado correctamente" })
  } catch (err) {
    console.error("Error al actualizar usuario:", err)
    res.status(400).json({ mensaje: "Error al actualizar usuario", error: err.message })
  }
}

// ✅ Eliminar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params

    await pool.query("DELETE FROM usuario_roles WHERE id_usuario = $1", [id])
    const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario y su rol eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar usuario" })
  }
}