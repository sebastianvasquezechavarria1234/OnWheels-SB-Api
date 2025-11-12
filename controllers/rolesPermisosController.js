import sql from "mssql"

// ✅ Obtener todos los permisos asignados a los roles
export const getRolesPermisos = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query(`
      SELECT rp.id_rol_permiso, r.nombre_rol, p.nombre_permiso
      FROM ROLES_PERMISOS rp
      INNER JOIN ROLES r ON rp.id_rol = r.id_rol
      INNER JOIN PERMISOS p ON rp.id_permiso = p.id_permiso
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener relaciones de roles y permisos" })
  }
}

// ✅ Asignar permiso a un rol
export const asignarPermisoARol = async (req, res) => {
  try {
    const { id_rol, id_permiso } = req.body
    const pool = await sql.connect()
    await pool.request()
      .input("id_rol", sql.Int, id_rol)
      .input("id_permiso", sql.Int, id_permiso)
      .query(`
        INSERT INTO ROLES_PERMISOS (id_rol, id_permiso)
        VALUES (@id_rol, @id_permiso)
      `)
    res.status(201).json({ mensaje: "Permiso asignado al rol correctamente" })
  } catch (err) {
    res.status(400).json({ mensaje: "Error al asignar permiso al rol", error: err.message })
  }
}

// ✅ Eliminar permiso de un rol
export const eliminarPermisoDeRol = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM ROLES_PERMISOS WHERE id_rol_permiso = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Relación no encontrada" })
    }

    res.json({ mensaje: "Permiso eliminado del rol correctamente" })
  } catch (err) {
    res.status(500).json({ mensaje: "Error al eliminar permiso del rol" })
  }
}
