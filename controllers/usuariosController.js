import pool from "../db/postgresPool.js";
import bcrypt from "bcryptjs";

/**
 * Obtener todos los usuarios con sus roles (roles -> array de objetos)
 */
export const getUsuarios = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado,
        COALESCE(
          json_agg(
            json_build_object('id_rol', r.id_rol, 'nombre_rol', r.nombre_rol)
          ) FILTER (WHERE r.id_rol IS NOT NULL),
        '[]') AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON ur.id_usuario = u.id_usuario
      LEFT JOIN roles r ON r.id_rol = ur.id_rol
      GROUP BY 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado
      ORDER BY u.nombre_completo ASC;
    `;

    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    return res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

/**
 * Obtener usuario por ID con roles (roles -> array)
 */
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado,
        COALESCE(
          json_agg(
            json_build_object('id_rol', r.id_rol, 'nombre_rol', r.nombre_rol)
          ) FILTER (WHERE r.id_rol IS NOT NULL),
        '[]') AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON ur.id_usuario = u.id_usuario
      LEFT JOIN roles r ON r.id_rol = ur.id_rol
      WHERE u.id_usuario = $1
      GROUP BY 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado;
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener usuario por id:", err);
    return res.status(500).json({ mensaje: "Error al obtener usuario" });
  }
};

/**
 * Verificar si email existe — devuelve { existe: boolean, usuario?: {...} }
 */
export const verificarEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const query = `
      SELECT 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado,
        COALESCE(
          json_agg(
            json_build_object('id_rol', r.id_rol, 'nombre_rol', r.nombre_rol)
          ) FILTER (WHERE r.id_rol IS NOT NULL),
        '[]') AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON ur.id_usuario = u.id_usuario
      LEFT JOIN roles r ON r.id_rol = ur.id_rol
      WHERE u.email = $1
      GROUP BY 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado;
    `;
    const result = await pool.query(query, [email]);

    if (result.rows.length > 0) {
      return res.json({ existe: true, usuario: result.rows[0] });
    }
    return res.json({ existe: false });
  } catch (err) {
    console.error("Error al verificar email:", err);
    return res.status(500).json({ mensaje: "Error al verificar email" });
  }
};

/**
 * Crear usuario + asignar rol (id_rol).
 * - Hashea la contraseña.
 * - Realiza todo en una transacción.
 */
export const createUsuario = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      documento = null,
      tipo_documento = null,
      nombre_completo,
      email,
      telefono = null,
      fecha_nacimiento = null,
      contrasena,
      id_rol = null
    } = req.body;

    if (!nombre_completo || !email || !contrasena) {
      return res.status(400).json({ mensaje: "nombre_completo, email y contrasena son obligatorios" });
    }

    // hash de la contraseña
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashed = await bcrypt.hash(contrasena, saltRounds);

    await client.query("BEGIN");

    const insertUserQ = `
      INSERT INTO usuarios
        (documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, contrasena)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id_usuario;
    `;
    const rUser = await client.query(insertUserQ, [
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
      fecha_nacimiento,
      hashed
    ]);
    const id_usuario = rUser.rows[0].id_usuario;

    if (id_rol !== null && id_rol !== undefined) {
      // validar rol
      const rolCheck = await client.query("SELECT id_rol FROM roles WHERE id_rol = $1", [id_rol]);
      if (rolCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ mensaje: "El rol indicado no existe" });
      }

      await client.query("INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)", [id_usuario, id_rol]);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: {
        id_usuario,
        nombre_completo,
        email,
        documento,
        tipo_documento,
        telefono,
        fecha_nacimiento,
        estado: true
      }
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error al crear usuario:", err);
    // Manejo posible conflicto de unique email/documento
    if (err.code === "23505") {
      return res.status(409).json({ mensaje: "Email o documento ya existe", detalle: err.detail });
    }
    return res.status(500).json({ mensaje: "Error al crear usuario", error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Actualizar usuario.
 * - Si se envía contrasena, se hashea y actualiza; si no, se conserva.
 * - Se usan COALESCE para preservar valores si no se envían.
 */
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      documento = null,
      tipo_documento = null,
      nombre_completo = null,
      email = null,
      telefono = null,
      fecha_nacimiento = null,
      contrasena = null
    } = req.body;

    let hashed = null;
    if (contrasena) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
      hashed = await bcrypt.hash(contrasena, saltRounds);
    }

    const query = `
      UPDATE usuarios
      SET documento = COALESCE($1, documento),
          tipo_documento = COALESCE($2, tipo_documento),
          nombre_completo = COALESCE($3, nombre_completo),
          email = COALESCE($4, email),
          telefono = COALESCE($5, telefono),
          fecha_nacimiento = COALESCE($6, fecha_nacimiento),
          contrasena = COALESCE($7, contrasena)
      WHERE id_usuario = $8
      RETURNING 
        id_usuario,
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        fecha_nacimiento,
        estado;
    `;
    const values = [documento, tipo_documento, nombre_completo, email, telefono, fecha_nacimiento, hashed, id];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    return res.json({ mensaje: "Usuario actualizado correctamente", usuario: result.rows[0] });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    if (err.code === "23505") {
      return res.status(409).json({ mensaje: "Email o documento ya existe", detalle: err.detail });
    }
    return res.status(500).json({ mensaje: "Error al actualizar usuario", error: err.message });
  }
};

/**
 * Eliminar usuario y sus roles asignados
 */
export const deleteUsuario = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");
    // eliminar asignaciones de rol
    await client.query("DELETE FROM usuario_roles WHERE id_usuario = $1", [id]);
    // (Si hay tablas específicas que dependen de usuarios, eliminarlas aquí si quieres)
    const result = await client.query("DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    await client.query("COMMIT");
    return res.json({ mensaje: "Usuario y sus roles eliminados correctamente" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error al eliminar usuario:", err);
    return res.status(500).json({ mensaje: "Error al eliminar usuario", error: err.message });
  } finally {
    client.release();
  }
};