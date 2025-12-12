import pool from "./db/postgresPool.js";

(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'eventos';
    `);
    console.log("Columnas en eventos:", res.rows.map(c => c.column_name));
  } catch (err) {
    console.error("Error consultando schema:", err);
  }
})();
