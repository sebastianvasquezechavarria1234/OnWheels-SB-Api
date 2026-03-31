
import pool from "./db/postgresPool.js";

async function listRoles() {
  try {
    const res = await pool.query("SELECT * FROM roles");
    console.log("Roles in 'roles' table:", res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listRoles();
