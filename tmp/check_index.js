
import pool from "../db/postgresPool.js";

async function checkIndex() {
  try {
    const res = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'password_reset_tokens';
    `);
    console.log("Indexes:", res.rows);
    process.exit(0);
  } catch (err) {
    console.error("Index check error:", err);
    process.exit(1);
  }
}

checkIndex();
