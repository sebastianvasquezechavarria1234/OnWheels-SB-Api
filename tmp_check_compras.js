
import pool from "./db/postgresPool.js";

async function checkCompras() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'compras'");
    console.log("Columns in 'compras' table:", res.rows.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCompras();
