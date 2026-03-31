
import pool from "./db/postgresPool.js";

async function findMultiRoleUsers() {
  try {
    const res = await pool.query(`
      SELECT u.nombre_completo, string_agg(r.nombre_rol, ', ') as roles
      FROM usuarios u
      JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      JOIN roles r ON ur.id_rol = r.id_rol
      GROUP BY u.id_usuario, u.nombre_completo
      HAVING COUNT(*) > 1
      LIMIT 10
    `);
    console.log("MULTI_ROLE_USERS:", res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findMultiRoleUsers();
