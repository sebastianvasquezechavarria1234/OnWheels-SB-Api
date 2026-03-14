import pool from "./db/postgresPool.js";

async function run() {
  const client = await pool.connect();
  try {
    const plans = await client.query("SELECT id_plan, nombre_plan, duracion_meses FROM planes_clases LIMIT 5");
    console.log("Plans:", plans.rows);

    // Let's test the date logic
    const testDate = await client.query("SELECT CURRENT_DATE as inicio, (CURRENT_DATE + ('1' || ' months')::interval) as fin_1_mes, (CURRENT_DATE + (NULL || ' months')::interval) as fin_null");
    console.log("Date Logic:", testDate.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
