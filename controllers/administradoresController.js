// controllers/administradoresController.js
import pool from "../db/postgresPool.js";

// ✅ Obtener todos los administradores
// ✅ Obtener todos los administradores (con paginación opcional)
export const getAdministradores = async (req, res) => {
  try {
    const { page, limit, search, tipo_admin } = req.query;

    let baseQuery = `
      SELECT 
        u.id_usuario,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.documento,
        r.nombre_rol AS rol,
        a.id_admin,
        a.tipo_admin,
        a.area
      FROM usuarios u
      INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      INNER JOIN roles r ON ur.id_rol = r.id_rol
      LEFT JOIN administradores a ON u.id_usuario = a.id_usuario
      WHERE u.estado = TRUE
        AND LOWER(TRIM(r.nombre_rol)) = 'administrador'
    `;

    let countQuery = `
      SELECT COUNT(*) 
      FROM usuarios u
      INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      INNER JOIN roles r ON ur.id_rol = r.id_rol
      LEFT JOIN administradores a ON u.id_usuario = a.id_usuario
      WHERE u.estado = TRUE
        AND LOWER(TRIM(r.nombre_rol)) = 'administrador'
    `;

    let values = [];
    let valIndex = 1;

    if (search) {
      const searchCondition = ` AND (
        u.nombre_completo ILIKE $${valIndex} OR 
        u.email ILIKE $${valIndex} OR 
        a.tipo_admin ILIKE $${valIndex} OR 
        a.area ILIKE $${valIndex}
      )`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      values.push(`%${search}%`);
      valIndex++;
    }

    if (tipo_admin && tipo_admin !== 'Todos') {
      const typeCondition = ` AND a.tipo_admin = $${valIndex}`;
      baseQuery += typeCondition;
      countQuery += typeCondition;
      values.push(tipo_admin);
      valIndex++;
    }

    baseQuery += " ORDER BY u.nombre_completo ASC";

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
    console.error("❌ Error al obtener administradores:", err);
    res.status(500).json({ mensaje: "Error al obtener administradores" });
  }
};

// ✅ Obtener administrador por ID
export const getAdministradorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        a.id_admin,
        a.id_usuario,
        a.tipo_admin,
        a.area,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.documento
      FROM administradores a
      JOIN usuarios u ON a.id_usuario = u.id_usuario
      WHERE a.id_admin = $1 AND u.estado = TRUE
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Administrador no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener administrador:", err);
    res.status(500).json({ mensaje: "Error al obtener administrador" });
  }
};

// ✅ Verificar si un usuario tiene un rol incompatible
const usuarioTieneRol = async (id_usuario, rolesProhibidos) => {
  const result = await pool.query(`
    SELECT r.nombre_rol
    FROM usuario_roles ur
    JOIN roles r ON ur.id_rol = r.id_rol
    WHERE ur.id_usuario = $1 AND r.nombre_rol = ANY($2)
  `, [id_usuario, rolesProhibidos]);
  return result.rows.length > 0;
};

// ✅ Crear administrador
export const createAdministrador = async (req, res) => {
  try {
    const { id_usuario, tipo_admin, area } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ mensaje: "El ID de usuario es obligatorio" });
    }

    // Verificar que el usuario exista y esté activo
    const userCheck = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = TRUE",
      [id_usuario]
    );
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ mensaje: "El usuario no existe o está inactivo" });
    }

    // Roles prohibidos al crear administrador
    const rolesProhibidos = ['Estudiante', 'Instructor', 'Cliente'];
    const tieneRolProhibido = await usuarioTieneRol(id_usuario, rolesProhibidos);
    if (tieneRolProhibido) {
      return res.status(400).json({
        mensaje: "El usuario ya tiene un rol incompatible (Administrador, Estudiante, Instructor o Cliente)"
      });
    }

    // Verificar que no sea ya administrador
    const adminCheck = await pool.query(
      "SELECT id_admin FROM administradores WHERE id_usuario = $1",
      [id_usuario]
    );
    if (adminCheck.rows.length > 0) {
      return res.status(400).json({ mensaje: "Este usuario ya es administrador" });
    }

    const result = await pool.query(
      `INSERT INTO administradores (id_usuario, tipo_admin, area)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_usuario, tipo_admin || null, area || null]
    );

    // Asignar rol "Administrador"
    const rolResult = await pool.query(
      "SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador'"
    );
    if (rolResult.rows.length > 0) {
      await pool.query(
        "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
        [id_usuario, rolResult.rows[0].id_rol]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al crear administrador:", err);
    res.status(400).json({ mensaje: "Error al crear administrador", error: err.message });
  }
};

// ✅ Actualizar administrador
export const updateAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, tipo_admin, area } = req.body;

    const existing = await pool.query(
      "SELECT id_admin, id_usuario FROM administradores WHERE id_admin = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ mensaje: "Administrador no encontrado" });
    }

    const oldIdUsuario = existing.rows[0].id_usuario;

    if (id_usuario && id_usuario !== oldIdUsuario) {
      const oldUserQuery = await pool.query("SELECT email FROM usuarios WHERE id_usuario = $1", [oldIdUsuario]);
      if (oldUserQuery.rows.length > 0 && oldUserQuery.rows[0].email === 'admin.demo@prueba.com') {
        return res.status(403).json({ mensaje: "No se puede modificar ni reasignar al Administrador Principal" });
      }

      const userCheck = await pool.query(
        "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = TRUE",
        [id_usuario]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ mensaje: "El nuevo usuario no existe o está inactivo" });
      }

      const rolesProhibidos = ['Administrador', 'Estudiante', 'Instructor', 'Cliente'];
      const tieneRolProhibido = await usuarioTieneRol(id_usuario, rolesProhibidos);
      if (tieneRolProhibido) {
        return res.status(400).json({
          mensaje: "El usuario seleccionado tiene un rol incompatible"
        });
      }

      const adminDuplicado = await pool.query(
        "SELECT id_admin FROM administradores WHERE id_usuario = $1 AND id_admin != $2",
        [id_usuario, id]
      );
      if (adminDuplicado.rows.length > 0) {
        return res.status(400).json({ mensaje: "Este usuario ya es administrador" });
      }

      // Eliminar rol antiguo
      const rolResult = await pool.query(
        "SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador'"
      );
      if (rolResult.rows.length > 0) {
        await pool.query(
          "DELETE FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2",
          [oldIdUsuario, rolResult.rows[0].id_rol]
        );
        await pool.query(
          "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
          [id_usuario, rolResult.rows[0].id_rol]
        );
      }
    }

    const result = await pool.query(
      `UPDATE administradores
       SET 
         id_usuario = $1,
         tipo_admin = $2,
         area = $3
       WHERE id_admin = $4
       RETURNING *`,
      [id_usuario || oldIdUsuario, tipo_admin || null, area || null, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al actualizar administrador:", err);
    res.status(400).json({ mensaje: "Error al actualizar administrador", error: err.message });
  }
};

// ✅ "Eliminar" administrador (soft delete → eliminar registro y rol)
export const deleteAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id_usuario FROM administradores WHERE id_admin = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Administrador no encontrado" });
    }

    const id_usuario = result.rows[0].id_usuario;

    // Proteger Administrador Principal
    const userQuery = await pool.query("SELECT email FROM usuarios WHERE id_usuario = $1", [id_usuario]);
    if (userQuery.rows.length > 0 && userQuery.rows[0].email === 'admin.demo@prueba.com') {
      return res.status(403).json({ mensaje: "No se puede eliminar al Administrador Principal" });
    }

    // Proteger al último administrador
    const countQuery = await pool.query(`
      SELECT COUNT(*) as count 
      FROM usuario_roles ur
      JOIN roles r ON ur.id_rol = r.id_rol
      WHERE LOWER(TRIM(r.nombre_rol)) = 'administrador'
    `);
    if (parseInt(countQuery.rows[0].count) <= 1) {
      return res.status(403).json({ mensaje: "Debe existir al menos un administrador en el sistema" });
    }

    // Eliminar registro
    await pool.query("DELETE FROM administradores WHERE id_admin = $1", [id]);

    // Eliminar rol
    const rolResult = await pool.query(
      "SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador'"
    );
    if (rolResult.rows.length > 0) {
      await pool.query(
        "DELETE FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2",
        [id_usuario, rolResult.rows[0].id_rol]
      );
    }

    res.json({ mensaje: "Administrador eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar administrador:", err);
    res.status(500).json({ mensaje: "Error al eliminar administrador" });
  }
};

// ✅ Obtener usuarios que pueden ser administradores
export const getUsuariosSinRol = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id_usuario, u.nombre_completo, u.email, u.documento
      FROM usuarios u
      WHERE u.estado = TRUE
        AND u.id_usuario NOT IN (
          SELECT ur.id_usuario
          FROM usuario_roles ur
          JOIN roles r ON ur.id_rol = r.id_rol
          WHERE r.nombre_rol IN ('Administrador', 'Estudiante', 'Instructor', 'Cliente')
        )
        AND u.id_usuario NOT IN (
          SELECT a.id_usuario
          FROM administradores a
        )
      ORDER BY u.nombre_completo ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios disponibles:", err);
    res.status(500).json({ mensaje: "Error al obtener usuarios disponibles" });
  }
};