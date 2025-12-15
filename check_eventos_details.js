import pool from "./db/postgresPool.js";

(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'eventos';
    `);
    console.log("Detalles columnas eventos:", res.rows);
  } catch (err) {
    console.error("Error consultando schema:", err);
  }
})();
