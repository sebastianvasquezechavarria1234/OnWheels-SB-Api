import pool from "../db/postgresPool.js"

// Obtener todos los permisos asignados a los roles
export const getRolesPermisos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rp.id_rol_permiso, r.nombre_rol, p.nombre_permiso, p.descripcion
      FROM rol_permisos rp
      INNER JOIN roles r ON rp.id_rol = r.id_rol
      INNER JOIN permisos p ON rp.id_permiso = p.id_permiso
      ORDER BY r.nombre_rol, p.nombre_permiso
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener relaciones de roles y permisos" })
  }
}

export const asignarPermisoARol = async (req, res) => {
  try {
    const { id_rol, id_permiso } = req.body

    if (!id_rol || !id_permiso) {
      return res.status(400).json({ mensaje: "id_rol e id_permiso son requeridos" })
    }

    const rolExists = await pool.query("SELECT id_rol FROM roles WHERE id_rol = $1", [id_rol])

    if (rolExists.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    const permisoExists = await pool.query("SELECT id_permiso FROM permisos WHERE id_permiso = $1", [id_permiso])

    if (permisoExists.rows.length === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" })
    }

    const duplicate = await pool.query(
      "SELECT id_rol_permiso FROM rol_permisos WHERE id_rol = $1 AND id_permiso = $2",
      [id_rol, id_permiso],
    )

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ mensaje: "Este permiso ya está asignado a este rol" })
    }

    const result = await pool.query(
      "INSERT INTO rol_permisos (id_rol, id_permiso) VALUES ($1, $2) RETURNING id_rol_permiso",
      [id_rol, id_permiso],
    )

    res.status(201).json({
      mensaje: "Permiso asignado al rol correctamente",
      id_rol_permiso: result.rows[0].id_rol_permiso,
    })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al asignar permiso al rol", error: err.message })
  }
}

export const eliminarPermisoDeRol = async (req, res) => {
  try {
    const { id_rol, id_permiso } = req.body

    if (!id_rol || !id_permiso) {
      return res.status(400).json({
        mensaje: "id_rol e id_permiso son requeridos",
      })
    }

    const result = await pool.query("DELETE FROM rol_permisos WHERE id_rol = $1 AND id_permiso = $2", [
      id_rol,
      id_permiso,
    ])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "La asignación de permiso no existe" })
    }

    res.json({ mensaje: "Permiso removido del rol correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar permiso del rol", error: err.message })
  }
}

// ============= ROLES =============

// Obtener todos los roles
export const getAllRoles = async (req, res) => {
  try {
    const result = await pool.query("SELECT id_rol, nombre_rol FROM roles ORDER BY nombre_rol")
    res.json(result.rows)
  } catch (error) {
    console.error("Error al obtener roles:", error)
    res.status(500).json({ mensaje: "Error al obtener roles" })
  }
}

// Obtener rol por ID con sus permisos
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params

    const role = await pool.query("SELECT id_rol, nombre_rol FROM roles WHERE id_rol = $1", [id])

    if (role.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    const permisos = await pool.query(
      `SELECT p.id_permiso, p.nombre_permiso, p.descripcion
       FROM permisos p
       INNER JOIN rol_permisos rp ON p.id_permiso = rp.id_permiso
       WHERE rp.id_rol = $1`,
      [id],
    )

    res.json({
      ...role.rows[0],
      permisos: permisos.rows,
    })
  } catch (error) {
    console.error("Error al obtener rol:", error)
    res.status(500).json({ mensaje: "Error al obtener rol" })
  }
}

// Crear nuevo rol
export const createRole = async (req, res) => {
  try {
    const { nombre_rol } = req.body

    if (!nombre_rol || nombre_rol.trim() === "") {
      return res.status(400).json({ mensaje: "El nombre del rol es requerido" })
    }

    const rolesProtegidos = ["cliente", "estudiante", "administrador", "instructor"]
    if (rolesProtegidos.includes(nombre_rol.toLowerCase())) {
      return res.status(400).json({
        mensaje: "No se pueden crear roles con nombres reservados",
      })
    }

    const result = await pool.query("INSERT INTO roles (nombre_rol) VALUES ($1) RETURNING *", [nombre_rol])

    res.status(201).json({
      mensaje: "Rol creado exitosamente",
      rol: result.rows[0],
    })
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ mensaje: "El rol ya existe" })
    }
    console.error("Error al crear rol:", error)
    res.status(500).json({ mensaje: "Error al crear rol" })
  }
}

// Actualizar rol
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_rol } = req.body

    if (!nombre_rol || nombre_rol.trim() === "") {
      return res.status(400).json({ mensaje: "El nombre del rol es requerido" })
    }

    const result = await pool.query("UPDATE roles SET nombre_rol = $1 WHERE id_rol = $2 RETURNING *", [nombre_rol, id])

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json({
      mensaje: "Rol actualizado exitosamente",
      rol: result.rows[0],
    })
  } catch (error) {
    console.error("Error al actualizar rol:", error)
    res.status(500).json({ mensaje: "Error al actualizar rol" })
  }
}

// ============= PERMISOS =============

// Obtener todos los permisos/módulos
export const getAllPermisos = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_permiso, nombre_permiso, descripcion FROM permisos ORDER BY nombre_permiso",
    )
    res.json(result.rows)
  } catch (error) {
    console.error("Error al obtener permisos:", error)
    res.status(500).json({ mensaje: "Error al obtener permisos" })
  }
}

// ============= ASIGNACIÓN USUARIO <-> ROL =============

// Asignar rol a un usuario
export const asignarRolAUsuario = async (req, res) => {
  try {
    const { id_usuario, id_rol } = req.body

    if (!id_usuario || !id_rol) {
      return res.status(400).json({
        mensaje: "id_usuario e id_rol son requeridos",
      })
    }

    const user = await pool.query("SELECT id_usuario FROM usuarios WHERE id_usuario = $1", [id_usuario])
    if (user.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }

    const role = await pool.query("SELECT id_rol FROM roles WHERE id_rol = $1", [id_rol])
    if (role.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    // Validar restricciones de combinación de roles
    const restricciones = {
      administrador: ["administrador"],
      estudiante: ["administrador"],
      instructor: ["administrador"],
    }

    const rolesActuales = await pool.query(
      `SELECT r.nombre_rol FROM usuario_roles ur
       INNER JOIN roles r ON ur.id_rol = r.id_rol
       WHERE ur.id_usuario = $1`,
      [id_usuario],
    )

    const nombreRolAAsignar = (await pool.query("SELECT nombre_rol FROM roles WHERE id_rol = $1", [id_rol])).rows[0]
      .nombre_rol

    for (const row of rolesActuales.rows) {
      if (restricciones[nombreRolAAsignar]?.includes(row.nombre_rol)) {
        return res.status(400).json({
          mensaje: `No se puede asignar ${nombreRolAAsignar} porque el usuario ya tiene rol ${row.nombre_rol}`,
        })
      }
      if (restricciones[row.nombre_rol]?.includes(nombreRolAAsignar)) {
        return res.status(400).json({
          mensaje: `No se puede asignar ${nombreRolAAsignar} porque entra en conflicto con ${row.nombre_rol}`,
        })
      }
    }

    await pool.query("INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
      id_usuario,
      id_rol,
    ])

    res.json({ mensaje: "Rol asignado al usuario exitosamente" })
  } catch (error) {
    console.error("Error al asignar rol:", error)
    res.status(500).json({ mensaje: "Error al asignar rol" })
  }
}

// Remover rol de un usuario
export const removerRolDeUsuario = async (req, res) => {
  try {
    const { id_usuario, id_rol } = req.body

    if (!id_usuario || !id_rol) {
      return res.status(400).json({
        mensaje: "id_usuario e id_rol son requeridos",
      })
    }

    const result = await pool.query("DELETE FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2", [
      id_usuario,
      id_rol,
    ])

    if (result.rowCount === 0) {
      return res.status(404).json({
        mensaje: "La asignación de rol no existe",
      })
    }

    res.json({ mensaje: "Rol removido del usuario exitosamente" })
  } catch (error) {
    console.error("Error al remover rol:", error)
    res.status(500).json({ mensaje: "Error al remover rol" })
  }
}

// Obtener todos los roles de un usuario
export const getRolesDeUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params

    const result = await pool.query(
      `SELECT r.id_rol, r.nombre_rol FROM usuario_roles ur
       INNER JOIN roles r ON ur.id_rol = r.id_rol
       WHERE ur.id_usuario = $1
       ORDER BY r.nombre_rol`,
      [id_usuario],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("Error al obtener roles del usuario:", error)
    res.status(500).json({ mensaje: "Error al obtener roles del usuario" })
  }
}
