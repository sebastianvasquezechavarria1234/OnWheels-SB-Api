
import pool from "./db/postgresPool.js";

async function checkProveedoresSchema() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'proveedores'");
    console.log("Columns in 'proveedores' table:", res.rows.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProveedoresSchema();
