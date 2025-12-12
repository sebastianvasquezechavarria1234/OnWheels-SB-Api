import pool from "./db/postgresPool.js";

(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'envios_masivos';
    `);
    console.log("Columnas en envios_masivos:", res.rows);
  } catch (err) {
    console.error("Error consultando schema:", err);
  }
})();
