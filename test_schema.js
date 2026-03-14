import pool from "./db/postgresPool.js";

async function run() {
  const client = await pool.connect();
  try {
    const matriculasCols = await client.query(`
      SELECT column_name, column_default, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'matriculas';
    `);
    console.log("Matriculas schema:");
    console.table(matriculasCols.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
