// controllers/usuariosController.js
import pool from "../db/postgresPool.js"
import Usuario from "../models/Usuarios.js"

// ✅ Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY nombre_completo ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuarios" })
  }
}

// ✅ Obtener usuario por ID
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("SELECT * FROM usuarios WHERE id_usuario = $1", [id])

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
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email])

    if (result.rows.length > 0) {
      return res.json({ existe: true, usuario: result.rows[0] })
    }

    res.json({ existe: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al verificar email" })
  }
}

// ✅ Crear usuario
export const createUsuario = async (req, res) => {
  try {
    const {
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
      fecha_nacimiento,
      direccion,
      contraseña,
      tipo_genero
    } = req.body

    const result = await pool.query(
      `INSERT INTO usuarios 
      (documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, direccion, contraseña, tipo_genero)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id_usuario`,
      [
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        fecha_nacimiento,
        direccion,
        contraseña,
        tipo_genero
      ]
    )

    const nuevoUsuario = new Usuario({
      id_usuario: result.rows[0].id_usuario,
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
      fecha_nacimiento,
      direccion,
      contraseña,
      tipo_genero
    })

    res.status(201).json(nuevoUsuario)
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear usuario", error: err.message })
  }
}

// ✅ Actualizar usuario
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
      direccion,
      contraseña,
      tipo_genero
    } = req.body

    const result = await pool.query(
      `UPDATE usuarios
       SET documento = $1,
           tipo_documento = $2,
           nombre_completo = $3,
           email = $4,
           telefono = $5,
           fecha_nacimiento = $6,
           direccion = $7,
           contraseña = $8,
           tipo_genero = $9
       WHERE id_usuario = $10`,
      [
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        fecha_nacimiento,
        direccion,
        contraseña,
        tipo_genero,
        id
      ]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar usuario", error: err.message })
  }
}

// ✅ Eliminar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar usuario" })
  }
}
