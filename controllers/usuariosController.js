import sql from "mssql";

// ✅ Obtener todos los usuarios (con datos de estudiante/instructor si existen)
export const getUsuarios = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        u.*,
        i.años_experiencia,
        i.estado AS estado_instructor,
        e.estado AS estado_estudiante
      FROM USUARIOS u
      LEFT JOIN INSTRUCTORES i ON u.id_usuario = i.id_usuario
      LEFT JOIN ESTUDIANTES e ON u.id_usuario = e.id_usuario
      ORDER BY u.nombre_completo ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

// ✅ Obtener un usuario por ID (con datos extendidos)
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          u.*,
          i.años_experiencia,
          i.estado AS estado_instructor,
          e.estado AS estado_estudiante
        FROM USUARIOS u
        LEFT JOIN INSTRUCTORES i ON u.id_usuario = i.id_usuario
        LEFT JOIN ESTUDIANTES e ON u.id_usuario = e.id_usuario
        WHERE u.id_usuario = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener usuario" });
  }
};

// ✅ Verificar si email existe
export const verificarEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const pool = await sql.connect();
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query("SELECT id_usuario FROM USUARIOS WHERE email = @email");

    if (result.recordset.length > 0) {
      return res.json({ existe: true, id_usuario: result.recordset[0].id_usuario });
    }
    res.json({ existe: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al verificar email" });
  }
};

// ✅ Crear usuario (y registros adicionales si aplica)
export const createUsuario = async (req, res) => {
  const transaction = new sql.Transaction();
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
      tipo_genero,
      id_rol,
      años_experiencia,
      estado_estudiante = true,
      estado_instructor = true,
    } = req.body;

    await transaction.begin();

    const request = new sql.Request(transaction);

    // 1. Insertar en USUARIOS
    const usuarioResult = await request
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
        OUTPUT INSERTED.id_usuario
        VALUES (@documento, @tipo_documento, @nombre_completo, @email, @telefono, @fecha_nacimiento, @direccion, @contraseña, @tipo_genero)
      `);

    const id_usuario = usuarioResult.recordset[0].id_usuario;

    // 2. Asignar rol en USUARIO_ROLES
    await request
      .input("id_usuario", sql.Int, id_usuario)
      .input("id_rol", sql.Int, id_rol)
      .query("INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (@id_usuario, @id_rol)");

    // 3. Si es instructor → insertar en INSTRUCTORES
    const roles = await new sql.Request().query("SELECT nombre_rol FROM ROLES WHERE id_rol = @id_rol", { id_rol });
    const rolNombre = roles.recordset[0]?.nombre_rol?.toLowerCase() || "";

    if (rolNombre.includes("instructor")) {
      await request
        .input("id_usuario_ins", sql.Int, id_usuario)
        .input("años_experiencia", sql.Int, años_experiencia || null)
        .input("estado_ins", sql.Bit, estado_instructor)
        .query(`
          INSERT INTO INSTRUCTORES (id_usuario, años_experiencia, estado)
          VALUES (@id_usuario_ins, @años_experiencia, @estado_ins)
        `);
    }

    // 4. Si es estudiante → insertar en ESTUDIANTES
    if (rolNombre.includes("estudiante")) {
      await request
        .input("id_usuario_est", sql.Int, id_usuario)
        .input("estado_est", sql.Bit, estado_estudiante)
        .query(`
          INSERT INTO ESTUDIANTES (id_usuario, estado)
          VALUES (@id_usuario_est, @estado_est)
        `);
    }

    await transaction.commit();

    res.status(201).json({
      mensaje: "Usuario creado correctamente",
      id_usuario,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error en transacción:", err);
    res.status(400).json({ mensaje: "Error al crear usuario", error: err.message });
  }
};

// ✅ Actualizar usuario (y datos adicionales si existen)
export const updateUsuario = async (req, res) => {
  const transaction = new sql.Transaction();
  try {
    const { id } = req.params;
    const {
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
      fecha_nacimiento,
      direccion,
      contraseña,
      tipo_genero,
      id_rol,
      años_experiencia,
      estado_estudiante,
      estado_instructor,
    } = req.body;

    await transaction.begin();
    const request = new sql.Request(transaction);

    // 1. Actualizar USUARIOS
    const usuarioUpdate = await request
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
      `);

    if (usuarioUpdate.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // 2. Actualizar rol en USUARIO_ROLES
    const rolActual = await new sql.Request()
      .input("id_usuario", sql.Int, id)
      .query("SELECT id_rol FROM USUARIO_ROLES WHERE id_usuario = @id_usuario");

    if (rolActual.recordset.length > 0) {
      await request
        .input("id_usuario_ur", sql.Int, id)
        .input("nuevo_id_rol", sql.Int, id_rol)
        .query("UPDATE USUARIO_ROLES SET id_rol = @nuevo_id_rol WHERE id_usuario = @id_usuario_ur");
    } else {
      await request
        .input("id_usuario_new", sql.Int, id)
        .input("id_rol_new", sql.Int, id_rol)
        .query("INSERT INTO USUARIO_ROLES (id_usuario, id_rol) VALUES (@id_usuario_new, @id_rol_new)");
    }

    // 3. Actualizar INSTRUCTORES si aplica
    const roles = await new sql.Request().query("SELECT nombre_rol FROM ROLES WHERE id_rol = @id_rol", { id_rol });
    const rolNombre = roles.recordset[0]?.nombre_rol?.toLowerCase() || "";

    if (rolNombre.includes("instructor")) {
      const insExists = await new sql.Request()
        .input("id_u", sql.Int, id)
        .query("SELECT 1 FROM INSTRUCTORES WHERE id_usuario = @id_u");

      if (insExists.recordset.length > 0) {
        await request
          .input("id_u_ins", sql.Int, id)
          .input("años_exp", sql.Int, años_experiencia || null)
          .input("estado_ins", sql.Bit, estado_instructor)
          .query(`
            UPDATE INSTRUCTORES
            SET años_experiencia = @años_exp, estado = @estado_ins
            WHERE id_usuario = @id_u_ins
          `);
      } else {
        await request
          .input("id_u_ins_new", sql.Int, id)
          .input("años_exp_new", sql.Int, años_experiencia || null)
          .input("estado_ins_new", sql.Bit, estado_instructor)
          .query(`
            INSERT INTO INSTRUCTORES (id_usuario, años_experiencia, estado)
            VALUES (@id_u_ins_new, @años_exp_new, @estado_ins_new)
          `);
      }
    } else {
      // Si ya no es instructor, eliminar de INSTRUCTORES
      await new sql.Request()
        .input("id_u_del", sql.Int, id)
        .query("DELETE FROM INSTRUCTORES WHERE id_usuario = @id_u_del");
    }

    // 4. Actualizar ESTUDIANTES si aplica
    if (rolNombre.includes("estudiante")) {
      const estExists = await new sql.Request()
        .input("id_u", sql.Int, id)
        .query("SELECT 1 FROM ESTUDIANTES WHERE id_usuario = @id_u");

      if (estExists.recordset.length > 0) {
        await request
          .input("id_u_est", sql.Int, id)
          .input("estado_est", sql.Bit, estado_estudiante)
          .query("UPDATE ESTUDIANTES SET estado = @estado_est WHERE id_usuario = @id_u_est");
      } else {
        await request
          .input("id_u_est_new", sql.Int, id)
          .input("estado_est_new", sql.Bit, estado_estudiante)
          .query("INSERT INTO ESTUDIANTES (id_usuario, estado) VALUES (@id_u_est_new, @estado_est_new)");
      }
    } else {
      await new sql.Request()
        .input("id_u_del_est", sql.Int, id)
        .query("DELETE FROM ESTUDIANTES WHERE id_usuario = @id_u_del_est");
    }

    await transaction.commit();
    res.json({ mensaje: "Usuario actualizado correctamente" });
  } catch (err) {
    await transaction.rollback();
    console.error("Error al actualizar usuario:", err);
    res.status(400).json({ mensaje: "Error al actualizar usuario", error: err.message });
  }
};

// ✅ Eliminar usuario (y registros relacionados)
export const deleteUsuario = async (req, res) => {
  const transaction = new sql.Transaction();
  try {
    const { id } = req.params;
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Eliminar dependencias
    await request.input("id", sql.Int, id).query("DELETE FROM USUARIO_ROLES WHERE id_usuario = @id");
    await request.input("id", sql.Int, id).query("DELETE FROM INSTRUCTORES WHERE id_usuario = @id");
    await request.input("id", sql.Int, id).query("DELETE FROM ESTUDIANTES WHERE id_usuario = @id");
    const result = await request.input("id", sql.Int, id).query("DELETE FROM USUARIOS WHERE id_usuario = @id");

    if (result.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    await transaction.commit();
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};