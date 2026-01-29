import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // Esperar 10s antes de dar timeout al conectar
  idleTimeoutMillis: 30000,      // Cerrar clientes inactivos tras 30s
  keepAlive: true,               // Mantener conexión viva
});

pool.on("connect", () => {
  console.log("✅ Conectado correctamente a la base de datos Neon");
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en el cliente PostgreSQL:", err);
  process.exit(-1);
});

export default pool;
