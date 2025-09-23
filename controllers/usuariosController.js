import sql from "mssql"

// ✅ Obtener todos
export const getUsuarios = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM USUARIOS ORDER BY nombre_completo ASC")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuarios" })
  }
}

// ✅ Obtener por ID
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM USUARIOS WHERE id_usuario = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener usuario" })
  }
}

// ✅ Verificar si email existe
export const verificarEmail = async (req, res) => {
  try {
    const { email } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM USUARIOS WHERE email = @email")

    if (result.recordset.length > 0) {
      return res.json({ existe: true, usuario: result.recordset[0] })
    }

    res.json({ existe: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al verificar email" })
  }
}

// ✅ Crear
export const createUsuario = async (req, res) => {
  try {
    const { documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, direccion, contraseña, tipo_genero } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("documento", sql.VarChar, documento)
      .input("tipo_documento", sql.VarChar, tipo_documento)
      .input("nombre_completo", sql.VarChar, nombre_completo)
      .input("email", sql.VarChar, email)
      .input("telefono", sql.VarChar, telefono)
      .input("fecha_nacimiento", sql.Date, fecha_nacimiento)
      .input("direccion", sql.VarChar, direccion)
      .input("contraseña", sql.VarChar, contraseña)
      .input("tipo_genero", sql.VarChar, tipo_genero)
      .query(`
        INSERT INTO USUARIOS (documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, direccion, contraseña, tipo_genero)
        VALUES (@documento, @tipo_documento, @nombre_completo, @email, @telefono, @fecha_nacimiento, @direccion, @contraseña, @tipo_genero);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    res.status(201).json({ mensaje: "Usuario creado correctamente", id_usuario: result.recordset[0].id })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear usuario", error: err.message })
  }
}

// ✅ Actualizar
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const { documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, direccion, contraseña, tipo_genero } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("documento", sql.VarChar, documento)
      .input("tipo_documento", sql.VarChar, tipo_documento)
      .input("nombre_completo", sql.VarChar, nombre_completo)
      .input("email", sql.VarChar, email)
      .input("telefono", sql.VarChar, telefono)
      .input("fecha_nacimiento", sql.Date, fecha_nacimiento)
      .input("direccion", sql.VarChar, direccion)
      .input("contraseña", sql.VarChar, contraseña)
      .input("tipo_genero", sql.VarChar, tipo_genero)
      .query(`
        UPDATE USUARIOS
        SET documento = @documento,
            tipo_documento = @tipo_documento,
            nombre_completo = @nombre_completo,
            email = @email,
            telefono = @telefono,
            fecha_nacimiento = @fecha_nacimiento,
            direccion = @direccion,
            contraseña = @contraseña,
            tipo_genero = @tipo_genero
        WHERE id_usuario = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar usuario", error: err.message })
  }
}

// ✅ Eliminar
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM USUARIOS WHERE id_usuario = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    res.json({ mensaje: "Usuario eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar usuario" })
  }
}
