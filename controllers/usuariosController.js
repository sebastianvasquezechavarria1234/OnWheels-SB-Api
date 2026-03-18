
import pool from "../db/postgresPool.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";

/**
 * Obtener todos los usuarios con sus roles (con paginación opcional)
 */
export const getUsuarios = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    let baseQuery = `
      SELECT 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.estado,
        u.foto_perfil,
        u.estado,
        COALESCE(
          json_agg(
            json_build_object('id_rol', r.id_rol, 'nombre_rol', r.nombre_rol)
          ) FILTER (WHERE r.id_rol IS NOT NULL),
        '[]') AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON ur.id_usuario = u.id_usuario
      LEFT JOIN roles r ON r.id_rol = ur.id_rol
    `;

    let countQuery = `
      SELECT COUNT(DISTINCT u.id_usuario)
      FROM usuarios u
    `;

    let values = [];
    let valIndex = 1;

    let whereClauses = [];
    if (search) {
      whereClauses.push(`(
        u.nombre_completo ILIKE $${valIndex} OR 
        u.email ILIKE $${valIndex} OR 
        u.documento ILIKE $${valIndex}
      )`);
      values.push(`%${search}%`);
      valIndex++;
    }

    if (whereClauses.length > 0) {
      const whereString = " WHERE " + whereClauses.join(" AND ");
      baseQuery += whereString;
      countQuery += whereString;
    }

    baseQuery += `
      GROUP BY 
        u.id_usuario,
        u.documento,
        u.tipo_documento,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.estado,
        u.foto_perfil
      ORDER BY u.nombre_completo ASC
    `;

    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      baseQuery += ` LIMIT $${valIndex} OFFSET $${valIndex + 1}`;
      values.push(parseInt(limit), offset);

      const [dataResult, countResult] = await Promise.all([
        pool.query(baseQuery, values),
        pool.query(countQuery, values.slice(0, valIndex - 1))
      ]);

      const total = parseInt(countResult.rows[0].count);
      return res.json({
        data: dataResult.rows,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      const result = await pool.query(baseQuery, values);
      return res.json(result.rows);
    }
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
        u.estado,
        u.foto_perfil,
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
        u.estado,
        u.foto_perfil;
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
        u.estado,
        u.foto_perfil,
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
        u.estado,
        u.foto_perfil;
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
        (documento, tipo_documento, nombre_completo, email, telefono, contrasena)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id_usuario;
    `;
    const rUser = await client.query(insertUserQ, [
      documento,
      tipo_documento,
      nombre_completo,
      email,
      telefono,
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
      contrasena = null,
      currentPassword = null,
      confirmPassword = null,
      fecha_nacimiento = null
    } = req.body;

    let hashed = null;

    // Validar si el usuario existe y si es el Administrador Principal
    const userQ = `SELECT email, contrasena FROM usuarios WHERE id_usuario = $1`;
    const rUser = await pool.query(userQ, [id]);
    if (rUser.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const storedEmail = rUser.rows[0].email;
    if (storedEmail === 'admin.demo@prueba.com' && email && email !== 'admin.demo@prueba.com') {
      return res.status(403).json({ mensaje: "No se puede modificar el correo electrónico del Administrador Principal" });
    }

    // Si se intenta cambiar la contraseña: validar currentPassword y confirmPassword
    if (contrasena) {

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
          contrasena = COALESCE($6, contrasena),
          fecha_nacimiento = COALESCE($7, fecha_nacimiento)
      WHERE id_usuario = $8
      RETURNING 
        id_usuario,
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        estado,
        foto_perfil,
        fecha_nacimiento;
    `;
    const values = [documento, tipo_documento, nombre_completo, email, telefono, hashed, fecha_nacimiento, id];

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

    const userQuery = await client.query("SELECT email FROM usuarios WHERE id_usuario = $1", [id]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (userQuery.rows[0].email === 'admin.demo@prueba.com') {
      return res.status(403).json({ mensaje: "No se puede eliminar al Administrador Principal" });
    }

    // Verificar si es administrador y cuántos quedan
    const adminCheck = await client.query(`
      SELECT r.nombre_rol 
      FROM usuario_roles ur
      JOIN roles r ON ur.id_rol = r.id_rol
      WHERE ur.id_usuario = $1 AND LOWER(TRIM(r.nombre_rol)) = 'administrador'
    `, [id]);

    if (adminCheck.rows.length > 0) {
      const countQuery = await client.query(`
        SELECT COUNT(*) as count 
        FROM usuario_roles ur
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE LOWER(TRIM(r.nombre_rol)) = 'administrador'
      `);
      if (parseInt(countQuery.rows[0].count) <= 1) {
        return res.status(403).json({ mensaje: "Debe existir al menos un administrador en el sistema" });
      }
    }

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
    const { nombre, telefono, direccion, fecha_nacimiento } = req.body; // Frontend envía 'nombre', no 'nombre_completo'

    // Nota: 'direccion' no parece existir en la tabla usuarios basada en el código actual,
    // pero se incluye por si acaso se agrega posteriormente o si existe en DB pero no en select.
    // Por ahora, actualizamos nombre y telefono.

    const query = `
      UPDATE usuarios
      SET
        nombre_completo = COALESCE($1, nombre_completo),
        telefono = COALESCE($2, telefono),
        fecha_nacimiento = COALESCE($3, fecha_nacimiento)
      WHERE id_usuario = $4
      RETURNING
        id_usuario,
        documento,
        tipo_documento,
        nombre_completo,
        email,
        telefono,
        estado,
        foto_perfil,
        fecha_nacimiento;
    `;

    const result = await pool.query(query, [nombre, telefono, fecha_nacimiento, id]);

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

/**
 * Subir o actualizar foto de perfil a Cloudinary.
 * Ruta esperada (como ejemplo): POST /api/usuarios/:id/foto
 */
export const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ mensaje: "No se ha subido ninguna imagen" });
    }

    // Comprobar que el usuario exista
    const userCheck = await pool.query("SELECT * FROM usuarios WHERE id_usuario = $1", [id]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Convertir el buffer en un array buffer manejable por cloudinary mediante un stream
    // o usando un upload_stream
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "onwheels_perfiles", // Carpeta en Cloudinary
            public_id: `user_${id}_${Date.now()}` // ID con un timestamp para evitar cache
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();
    const secureUrl = cloudinaryResult.secure_url;

    // Actualizar la tabla
    await pool.query(
      "UPDATE usuarios SET foto_perfil = $1 WHERE id_usuario = $2",
      [secureUrl, id]
    );

    return res.json({
      mensaje: "Foto de perfil subida correctamente",
      foto_perfil: secureUrl
    });
  } catch (error) {
    console.error("Error en uploadProfileImage:", error);
    try {
      const fs = await import('fs');
      fs.writeFileSync('C:/OnWheels-SB-Api/foto_error.log', JSON.stringify(error, Object.getOwnPropertyNames(error)) + " || " + String(error));
    } catch(e) {}
    return res.status(500).json({ mensaje: "Error al subir la imagen", error: error.message || error.name || "Error desconocido en Cloudinary" });
  }
};
