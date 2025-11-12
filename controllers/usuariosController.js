// controllers/usuariosController.js
import pool from "../db/postgresPool.js"
import Usuario from "../models/Usuarios.js"

// ✅ Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY nombre_completo ASC")
    res.json(result.rows)
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

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
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener usuario" });
  }
};

// ✅ Verificar si email existe
export const verificarEmail = async (req, res) => {
  try {
    const { email } = req.params
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email])

    if (result.rows.length > 0) {
      return res.json({ existe: true, usuario: result.rows[0] })
    }
    res.json({ existe: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al verificar email" });
  }
};

// ✅ Crear usuario
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
    await transaction.rollback();
    console.error("Error en transacción:", err);
    res.status(400).json({ mensaje: "Error al crear usuario", error: err.message });
  }
};

// ✅ Actualizar usuario
export const updateUsuario = async (req, res) => {
  const transaction = new sql.Transaction();
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

// ✅ Eliminar usuario
export const deleteUsuario = async (req, res) => {
  const transaction = new sql.Transaction();
  try {
    const { id } = req.params
    const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    await transaction.commit();
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};