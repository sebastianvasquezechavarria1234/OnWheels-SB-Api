
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
    await client.query("ROLLBACK").catch(() => { });
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
 *
 * Añadido: si se intenta cambiar contraseña, ahora requiere:
 *   - currentPassword en body (contraseña actual)
 *   - confirmPassword en body (confirmación de new password)
 * Verifica la contraseña actual con bcrypt.compare, verifica confirmación y luego hashea la nueva contraseña.
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
      contrasena = null,
      currentPassword = null,
      confirmPassword = null
    } = req.body;

    let hashed = null;

    // Si se intenta cambiar la contraseña: validar currentPassword y confirmPassword
    if (contrasena) {
      // comprobar que exista el usuario y obtener su hash actual
      const userQ = `SELECT contrasena FROM usuarios WHERE id_usuario = $1`;
      const rUser = await pool.query(userQ, [id]);
      if (rUser.rowCount === 0) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      const storedHash = rUser.rows[0].contrasena;
      if (!currentPassword) {
        return res.status(400).json({ mensaje: "Debe enviar la contraseña actual (currentPassword) para cambiar la contraseña" });
      }

      const isMatch = await bcrypt.compare(currentPassword, storedHash);
      if (!isMatch) {
        return res.status(401).json({ mensaje: "Contraseña actual incorrecta" });
      }

      if (!confirmPassword) {
        return res.status(400).json({ mensaje: "Debe enviar confirmPassword" });
      }

      if (contrasena !== confirmPassword) {
        return res.status(400).json({ mensaje: "La nueva contraseña y la confirmación no coinciden" });
      }

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
 * Verificar contraseña actual (para validación en tiempo real).
 * Ruta: POST /api/usuarios/:id/verify-password
 * Body: { currentPassword: string }
 * Respuesta: { valid: true } o { valid: false }
 */
export const verifyPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ mensaje: "Debe enviar currentPassword", valid: false });
    }

    const q = `SELECT contrasena FROM usuarios WHERE id_usuario = $1`;
    const r = await pool.query(q, [id]);

    if (r.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado", valid: false });
    }

    const storedHash = r.rows[0].contrasena || "";
    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    return res.json({ valid: !!isMatch });
  } catch (err) {
    console.error("Error verifyPassword:", err);
    return res.status(500).json({ mensaje: "Error al verificar contraseña", valid: false });
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
    const result = await client.query("DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    await client.query("COMMIT");
    return res.json({ mensaje: "Usuario y sus roles eliminados correctamente" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => { });
    console.error("Error al eliminar usuario:", err);
    return res.status(500).json({ mensaje: "Error al eliminar usuario", error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Obtiene usuarios que:
 * - NO tienen NINGÚN registro en estudiantes (cualquier estado)
 * - Tienen SOLO roles permitidos: 'cliente', 'usuario' o ninguno
 */
export const getUsuariosElegiblesParaEstudiante = async (req, res) => {
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
      LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario
      LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      WHERE e.id_usuario IS NULL
      GROUP BY 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.fecha_nacimiento,
        u.estado
      HAVING bool_and(
        r.nombre_rol IS NULL OR LOWER(TRIM(r.nombre_rol)) IN ('cliente', 'usuario')
      )
      ORDER BY u.nombre_completo ASC;
    `;

    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener usuarios elegibles para estudiante:", err);
    return res.status(500).json({ mensaje: "Error al obtener usuarios elegibles" });
  }
};

/**
 * Obtiene usuarios que tienen EXACTAMENTE un rol: 'Cliente' (y ningún otro rol).
 * Útil para promover exclusivamente a clientes puros como administradores.
 */
export const getUsuariosSoloConRolCliente = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre_completo,
        u.email,
        u.documento
      FROM usuarios u
      INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      INNER JOIN roles r ON ur.id_rol = r.id_rol
      WHERE u.estado = TRUE
      GROUP BY u.id_usuario, u.nombre_completo, u.email, u.documento
      HAVING 
        COUNT(*) = 1
        AND BOOL_AND(LOWER(TRIM(r.nombre_rol)) = 'cliente')
      ORDER BY u.nombre_completo ASC;
    `;

    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en getUsuariosSoloConRolCliente:", err);
    return res.status(500).json({ mensaje: "Error al obtener clientes elegibles para administrador" });
  }
};

/**
 * Obtiene lista de usuarios con indicador de si están en tabla clientes (para otros usos).
 * Esta es la versión original que ya usas en tus rutas.
 */
export const getUsuariosSinCliente = async (req, res) => {
  try {
    // Log para depurar
    console.log("✅ Iniciando getUsuariosSinCliente");

    const query = `
      SELECT 
        u.id_usuario, 
        u.nombre_completo, 
        u.email, 
        u.documento,
        CASE WHEN c.id_cliente IS NOT NULL THEN true ELSE false END AS es_cliente
      FROM usuarios u
      LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
      WHERE u.estado = true
      ORDER BY u.nombre_completo;
    `;

    const result = await pool.query(query);

    console.log("✅ Query ejecutada. Filas:", result.rows.length);

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en getUsuariosSinCliente:", err);
    // Devuelve un error estructurado
    return res.status(500).json({
      mensaje: "Error interno del servidor",
      error: err.message || "Error desconocido"
    });
  }
};

/**
 * Actualizar perfil del usuario autenticado.
 * - Solo permite actualizar datos restringidos (nombre, telefono).
 * - Usa estrictamente req.user.id_usuario.
 * - Mapea 'nombre' (frontend) a 'nombre_completo' (db).
 */
export const updatePerfil = async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const { nombre, telefono, direccion } = req.body; // Frontend envía 'nombre', no 'nombre_completo'

    // Nota: 'direccion' no parece existir en la tabla usuarios basada en el código actual,
    // pero se incluye por si acaso se agrega posteriormente o si existe en DB pero no en select.
    // Por ahora, actualizamos nombre y telefono.

    const query = `
      UPDATE usuarios
      SET
        nombre_completo = COALESCE($1, nombre_completo),
        telefono = COALESCE($2, telefono)
      WHERE id_usuario = $3
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

    const result = await pool.query(query, [nombre, telefono, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    return res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: result.rows[0]
    });
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    return res.status(500).json({ mensaje: "Error al actualizar perfil", error: err.message });
  }
};
