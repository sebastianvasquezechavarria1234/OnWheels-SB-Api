import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("connect", () => {
  console.log("✅ Conectado correctamente a la base de datos Neon");
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en el cliente PostgreSQL:", err);
  process.exit(-1);
});

export default pool;
