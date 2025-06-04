import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// Modelo de Usuario para MongoDB
const usuarioSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  name: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: String,
  role: String,
  password: String,
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
})

// Middleware para generar ID incremental
usuarioSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    try {
      // Buscar el último usuario por ID incremental
      const ultimoUsuario = await this.constructor.findOne({}, {}, { sort: { id: -1 } })

      // Si no hay usuarios, empezar en 1, si hay usuarios, sumar 1 al último ID
      this.id = ultimoUsuario && ultimoUsuario.id ? ultimoUsuario.id + 1 : 1

      console.log(`🆔 Generando ID: ${this.id}`)
    } catch (error) {
      console.error("Error generando ID:", error)
      return next(error)
    }
  }
  next()
})

const Usuario = mongoose.model("Usuario", usuarioSchema)

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("-password -__v")
    res.json(usuarios)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuarios" })
  }
}

export const createUsuario = async (req, res) => {
  try {
    // Verificar si el email ya existe
    const emailNormalizado = req.body.email.toLowerCase().trim()
    const emailExiste = await Usuario.findOne({ email: emailNormalizado })

    if (emailExiste) {
      return res.status(400).json({
        mensaje: `El email ${emailNormalizado} ya está registrado`,
        error: "EMAIL_DUPLICADO",
      })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    // Crear usuario
    const nuevoUsuario = new Usuario({
      name: req.body.name,
      lastName: req.body.lastName,
      email: emailNormalizado,
      phone: req.body.phone,
      role: req.body.role || "estudiante",
      password: hashedPassword,
    })

    await nuevoUsuario.save()

    // No devolver la contraseña
    const usuarioGuardado = nuevoUsuario.toObject()
    delete usuarioGuardado.password
    delete usuarioGuardado.__v

    res.status(201).json(usuarioGuardado)
  } catch (err) {
    // Manejar error de duplicado
    if (err.code === 11000) {
      const campo = Object.keys(err.keyPattern)[0]
      return res.status(400).json({
        mensaje: `El ${campo} ya está registrado`,
        error: "CAMPO_DUPLICADO",
      })
    }

    console.error(err)
    res.status(400).json({ mensaje: "Error al crear usuario", error: err.message })
  }
}

export const getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ id: Number.parseInt(req.params.id) }).select("-password -__v")

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json(usuario)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuario" })
  }
}

export const updateUsuario = async (req, res) => {
  try {
    // No permitir actualizar contraseña por esta vía
    delete req.body.password

    // Normalizar email si se está actualizando
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase().trim()

      // Verificar si el email ya existe
      const emailExiste = await Usuario.findOne({
        email: req.body.email,
        id: { $ne: Number.parseInt(req.params.id) },
      })

      if (emailExiste) {
        return res.status(400).json({
          mensaje: `El email ${req.body.email} ya está registrado por otro usuario`,
          error: "EMAIL_DUPLICADO",
        })
      }
    }

    const usuarioActualizado = await Usuario.findOneAndUpdate({ id: Number.parseInt(req.params.id) }, req.body, {
      new: true,
      runValidators: true,
    }).select("-password -__v")

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json(usuarioActualizado)
  } catch (err) {
    // Manejar error de duplicado
    if (err.code === 11000) {
      const campo = Object.keys(err.keyPattern)[0]
      return res.status(400).json({
        mensaje: `El ${campo} ya está registrado por otro usuario`,
        error: "CAMPO_DUPLICADO",
      })
    }

    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar usuario", error: err.message })
  }
}

export const deleteUsuario = async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findOneAndDelete({ id: Number.parseInt(req.params.id) })

    if (!usuarioEliminado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar usuario" })
  }
}

// Verificar si un email existe
export const verificarEmail = async (req, res) => {
  try {
    const emailNormalizado = req.params.email.toLowerCase().trim()
    const usuario = await Usuario.findOne({ email: emailNormalizado })

    res.json({
      existe: !!usuario,
      disponible: !usuario,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al verificar email" })
  }
}
