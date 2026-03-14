import pool from "./db/postgresPool.js";

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete duplicates 15 and 16
    await client.query("DELETE FROM pagos WHERE id IN (15, 16)");
    
    // Update total_pagado
    await client.query("UPDATE matriculas SET total_pagado = total_pagado - 220000 WHERE id_matricula = 27");

    await client.query("COMMIT");
    console.log("Cleanup complete");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
