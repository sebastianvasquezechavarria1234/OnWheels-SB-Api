
import pool from "../db/postgresPool.js";

async function checkTable() {
  try {
    const res = await pool.query("SELECT to_regclass('public.password_reset_tokens') as exists;");
    console.log("Table check:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("Error checking table:", err);
    process.exit(1);
  }
}

checkTable();
