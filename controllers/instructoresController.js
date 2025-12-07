// controllers/instructoresController.js
import pool from "../db/postgresPool.js";

// ✅ Obtener todos los instructores
export const getInstructores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id_instructor,
        i.id_usuario,
        i.anios_experiencia,
        i.especialidad,
        i.estado,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.documento
      FROM instructores i
      JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE i.estado = TRUE
      ORDER BY u.nombre_completo ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener instructores:", err);
    res.status(500).json({ mensaje: "Error al obtener instructores" });
  }
};

// ✅ Obtener instructor por ID
export const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        i.id_instructor,
        i.id_usuario,
        i.anios_experiencia,
        i.especialidad,
        i.estado,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.documento
      FROM instructores i
      JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE i.id_instructor = $1 AND i.estado = TRUE
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Instructor no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener instructor:", err);
    res.status(500).json({ mensaje: "Error al obtener instructor" });
  }
};

// ✅ Verificar si un usuario tiene un rol específico
const usuarioTieneRol = async (id_usuario, rolesProhibidos) => {
  const result = await pool.query(`
    SELECT r.nombre_rol
    FROM usuario_roles ur
    JOIN roles r ON ur.id_rol = r.id_rol
    WHERE ur.id_usuario = $1 AND r.nombre_rol = ANY($2)
  `, [id_usuario, rolesProhibidos]);
  return result.rows.length > 0;
};

// ✅ Crear instructor
export const createInstructor = async (req, res) => {
  try {
    const { id_usuario, anios_experiencia, especialidad } = req.body;

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

    // Verificar roles prohibidos
    const rolesProhibidos = ['Administrador', 'Estudiante', 'Instructor'];
    const tieneRolProhibido = await usuarioTieneRol(id_usuario, rolesProhibidos);
    if (tieneRolProhibido) {
      return res.status(400).json({ 
        mensaje: "El usuario ya tiene un rol incompatible (Administrador, Estudiante o Instructor)" 
      });
    }

    // Verificar que no sea ya instructor
    const instructorCheck = await pool.query(
      "SELECT id_instructor FROM instructores WHERE id_usuario = $1 AND estado = TRUE",
      [id_usuario]
    );
    if (instructorCheck.rows.length > 0) {
      return res.status(400).json({ mensaje: "Este usuario ya es instructor" });
    }

    const result = await pool.query(
      `INSERT INTO instructores (id_usuario, anios_experiencia, especialidad, estado)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [id_usuario, anios_experiencia || null, especialidad || null]
    );

    // Asignar rol de "Instructor"
    const rolResult = await pool.query(
      "SELECT id_rol FROM roles WHERE nombre_rol = 'Instructor'"
    );
    if (rolResult.rows.length > 0) {
      await pool.query(
        "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
        [id_usuario, rolResult.rows[0].id_rol]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al crear instructor:", err);
    res.status(400).json({ mensaje: "Error al crear instructor", error: err.message });
  }
};

// ✅ Actualizar instructor
export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, anios_experiencia, especialidad } = req.body;

    const existing = await pool.query(
      "SELECT id_instructor, id_usuario FROM instructores WHERE id_instructor = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ mensaje: "Instructor no encontrado" });
    }

    const oldIdUsuario = existing.rows[0].id_usuario;

    if (id_usuario && id_usuario !== oldIdUsuario) {
      const userCheck = await pool.query(
        "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = TRUE",
        [id_usuario]
      );
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ mensaje: "El nuevo usuario no existe o está inactivo" });
      }

      const rolesProhibidos = ['Administrador', 'Estudiante', 'Instructor'];
      const tieneRolProhibido = await usuarioTieneRol(id_usuario, rolesProhibidos);
      if (tieneRolProhibido) {
        return res.status(400).json({ 
          mensaje: "El usuario seleccionado tiene un rol incompatible" 
        });
      }

      const instructorDuplicado = await pool.query(
        "SELECT id_instructor FROM instructores WHERE id_usuario = $1 AND estado = TRUE AND id_instructor != $2",
        [id_usuario, id]
      );
      if (instructorDuplicado.rows.length > 0) {
        return res.status(400).json({ mensaje: "Este usuario ya es instructor" });
      }

      // Eliminar rol antiguo
      const oldRol = await pool.query(
        "SELECT id_rol FROM roles WHERE nombre_rol = 'Instructor'"
      );
      if (oldRol.rows.length > 0) {
        await pool.query(
          "DELETE FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2",
          [oldIdUsuario, oldRol.rows[0].id_rol]
        );
      }

      // Asignar nuevo rol
      if (oldRol.rows.length > 0) {
        await pool.query(
          "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
          [id_usuario, oldRol.rows[0].id_rol]
        );
      }
    }

    const result = await pool.query(
      `UPDATE instructores
       SET 
         id_usuario = COALESCE($1, id_usuario),
         anios_experiencia = COALESCE($2, anios_experiencia),
         especialidad = COALESCE($3, especialidad)
       WHERE id_instructor = $4
       RETURNING *`,
      [id_usuario, anios_experiencia, especialidad, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al actualizar instructor:", err);
    res.status(400).json({ mensaje: "Error al actualizar instructor", error: err.message });
  }
};

// ✅ Eliminar instructor (soft delete)
export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE instructores SET estado = FALSE WHERE id_instructor = $1 RETURNING id_usuario",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Instructor no encontrado" });
    }

    const id_usuario = result.rows[0].id_usuario;
    const rolResult = await pool.query(
      "SELECT id_rol FROM roles WHERE nombre_rol = 'Instructor'"
    );
    if (rolResult.rows.length > 0) {
      await pool.query(
        "DELETE FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2",
        [id_usuario, rolResult.rows[0].id_rol]
      );
    }

    res.json({ mensaje: "Instructor desactivado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar instructor:", err);
    res.status(500).json({ mensaje: "Error al eliminar instructor" });
  }
};

// ✅ Obtener usuarios que pueden ser instructores
export const getUsuariosNoInstructores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id_usuario, u.nombre_completo, u.email, u.documento
      FROM usuarios u
      WHERE u.estado = TRUE
        AND u.id_usuario NOT IN (
          SELECT ur.id_usuario
          FROM usuario_roles ur
          JOIN roles r ON ur.id_rol = r.id_rol
          WHERE r.nombre_rol IN ('Administrador', 'Estudiante', 'Instructor')
        )
        AND u.id_usuario NOT IN (
          SELECT i.id_usuario
          FROM instructores i
          WHERE i.estado = TRUE
        )
      ORDER BY u.nombre_completo ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios disponibles:", err);
    res.status(500).json({ mensaje: "Error al obtener usuarios disponibles" });
  }
};