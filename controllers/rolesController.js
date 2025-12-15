// controllers/rolesController.js
import pool from "../db/postgresPool.js";

// ✅ Obtener todos los roles
export const getRoles = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM roles ORDER BY nombre_rol ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error en getRoles:", err);
    res.status(500).json({ mensaje: "Error al obtener roles" });
  }
};

// ✅ Obtener rol por ID
export const getRolById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM roles WHERE id_rol = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en getRolById:", err);
    res.status(500).json({ mensaje: "Error al obtener rol" });
  }
};

// ✅ Crear rol
export const createRol = async (req, res) => {
  try {
    const { nombre_rol, descripcion, estado } = req.body;
    if (!nombre_rol?.trim()) {
      return res.status(400).json({ mensaje: "El nombre del rol es obligatorio" });
    }
    const result = await pool.query(
      `INSERT INTO roles (nombre_rol, descripcion, estado)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre_rol.trim(), descripcion || null, estado ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en createRol:", err);
    if (err.code === '23505') {
      return res.status(400).json({ mensaje: "Ya existe un rol con ese nombre" });
    }
    res.status(400).json({ mensaje: "Error al crear rol", error: err.message });
  }
};

// ✅ Actualizar rol
export const updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_rol, descripcion, estado } = req.body;
    if (!nombre_rol?.trim()) {
      return res.status(400).json({ mensaje: "El nombre del rol es obligatorio" });
    }
    const result = await pool.query(
      `UPDATE roles
       SET nombre_rol = $1,
           descripcion = $2,
           estado = $3
       WHERE id_rol = $4
       RETURNING *`,
      [nombre_rol.trim(), descripcion || null, estado ?? true, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" });
    }
    res.json({ mensaje: "Rol actualizado correctamente", rol: result.rows[0] });
  } catch (err) {
    console.error("Error en updateRol:", err);
    res.status(400).json({ mensaje: "Error al actualizar rol", error: err.message });
  }
};

// ✅ Eliminar rol
export const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;
    const officialRoles = [3, 9, 10, 12, 13];
    if (officialRoles.includes(parseInt(id))) {
      return res.status(400).json({ mensaje: "No se pueden eliminar roles oficiales" });
    }
    const result = await pool.query("DELETE FROM roles WHERE id_rol = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" });
    }
    res.json({ mensaje: "Rol eliminado correctamente" });
  } catch (err) {
    console.error("Error en deleteRol:", err);
    if (err.code === '23503') {
      return res.status(400).json({ mensaje: "No se puede eliminar el rol porque tiene permisos o usuarios asignados" });
    }
    res.status(500).json({ mensaje: "Error al eliminar rol" });
  }
};

// ✅ Obtener permisos de un rol (para el modal)
export const getPermisosByRol = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id_permiso, p.nombre_permiso, p.descripcion
       FROM roles_permisos rp
       JOIN permisos p ON rp.id_permiso = p.id_permiso
       WHERE rp.id_rol = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error en getPermisosByRol:", err);
    res.status(500).json({ mensaje: "Error al obtener permisos del rol" });
  }
};

// ✅ Asignar permiso a un rol (ruta: POST /roles/:id/permisos)
export const asignarPermisoARol = async (req, res) => {
  try {
    const idRol = req.params.id;
    const { id_permiso } = req.body;
    if (!id_permiso) {
      return res.status(400).json({ mensaje: "id_permiso es requerido" });
    }
    const rolExists = await pool.query("SELECT 1 FROM roles WHERE id_rol = $1", [idRol]);
    if (rolExists.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" });
    }
    const permisoExists = await pool.query("SELECT 1 FROM permisos WHERE id_permiso = $1", [id_permiso]);
    if (permisoExists.rows.length === 0) {
      return res.status(404).json({ mensaje: "Permiso no encontrado" });
    }
    const duplicate = await pool.query(
      "SELECT 1 FROM roles_permisos WHERE id_rol = $1 AND id_permiso = $2",
      [idRol, id_permiso]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ mensaje: "Permiso ya asignado al rol" });
    }
    await pool.query(
      "INSERT INTO roles_permisos (id_rol, id_permiso) VALUES ($1, $2)",
      [idRol, id_permiso]
    );
    res.status(201).json({ mensaje: "Permiso asignado correctamente" });
  } catch (err) {
    console.error("Error en asignarPermisoARol:", err);
    res.status(400).json({ mensaje: "Error al asignar permiso", error: err.message });
  }
};

// ✅ Eliminar permiso de un rol (ruta: DELETE /roles/:id/permisos/:idPermiso)
export const eliminarPermisoDeRol = async (req, res) => {
  try {
    const idRol = req.params.id;
    const idPermiso = req.params.idPermiso;
    const result = await pool.query(
      "DELETE FROM roles_permisos WHERE id_rol = $1 AND id_permiso = $2",
      [idRol, idPermiso]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Asignación no encontrada" });
    }
    res.json({ mensaje: "Permiso eliminado correctamente" });
  } catch (err) {
    console.error("Error en eliminarPermisoDeRol:", err);
    res.status(500).json({ mensaje: "Error al eliminar permiso", error: err.message });
  }
};