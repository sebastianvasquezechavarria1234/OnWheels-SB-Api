import pool from "./db/postgresPool.js";

async function run() {
  const client = await pool.connect();
  try {
    const pagos = await client.query("SELECT * FROM pagos ORDER BY id DESC LIMIT 10");
    console.table(pagos.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
