
import pool from "./db/postgresPool.js";

async function seeProveedoresData() {
  try {
    const res = await pool.query("SELECT * FROM proveedores LIMIT 20");
    console.log("PROVEEDORES_DATA:", JSON.stringify(res.rows));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seeProveedoresData();
