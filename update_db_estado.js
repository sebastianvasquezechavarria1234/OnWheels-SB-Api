import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE niveles_clases ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo'");
    console.log("Column 'estado' added successfully.");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
