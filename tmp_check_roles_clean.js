
import pool from "./db/postgresPool.js";

async function listRoles() {
  try {
    const res = await pool.query("SELECT id_rol, nombre_rol FROM roles");
    console.log("ROLES_LIST:", JSON.stringify(res.rows));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listRoles();
