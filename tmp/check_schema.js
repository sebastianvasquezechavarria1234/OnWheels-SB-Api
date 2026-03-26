
import pool from "../db/postgresPool.js";

async function checkSchema() {
  try {
    const res = await pool.query("SELECT * FROM information_schema.columns WHERE table_name = 'password_reset_tokens';");
    console.log("Columns:", res.rows.map(c => c.column_name));
    
    // Check constraints
    const constRes = await pool.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'password_reset_tokens'::regclass;
    `);
    console.log("Constraints:", constRes.rows);
    process.exit(0);
  } catch (err) {
    console.error("Error checking schema:", err);
    process.exit(1);
  }
}

checkSchema();
