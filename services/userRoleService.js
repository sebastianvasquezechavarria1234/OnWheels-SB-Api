import pool from "../db/postgresPool.js";

export const ensureUserRole = async (id_usuario, nombreRol, client = null) => {
  const db = client || pool;
  const nombreRolNormalizado = nombreRol.trim().toLowerCase();

  const roleResult = await db.query(
    `SELECT id_rol
     FROM roles
     WHERE LOWER(TRIM(nombre_rol)) = $1
     ORDER BY id_rol ASC
     LIMIT 1`,
    [nombreRolNormalizado]
  );

  if (roleResult.rowCount === 0) {
    throw new Error(`El rol ${nombreRolNormalizado} no existe en la base de datos`);
  }

  const id_rol = roleResult.rows[0].id_rol;

  await db.query(
    `INSERT INTO usuario_roles (id_usuario, id_rol)
     VALUES ($1, $2)
     ON CONFLICT (id_usuario, id_rol) DO NOTHING`,
    [id_usuario, id_rol]
  );

  return id_rol;
};

export const ensureStudentRole = async (id_usuario, client = null) => {
  return ensureUserRole(id_usuario, "estudiante", client);
};