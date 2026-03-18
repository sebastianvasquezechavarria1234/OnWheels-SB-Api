import pool from "./db/postgresPool.js";

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'genero';
    `);
    if (res.rowCount > 0) {
      console.log("Column 'genero' EXISTS");
    } else {
      console.log("Column 'genero' DOES NOT EXIST");
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
