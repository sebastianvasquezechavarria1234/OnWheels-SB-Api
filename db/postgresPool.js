import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000, // 15s para dar tiempo a que Neon despierte
  idleTimeoutMillis: 30000,       // Cerrar clientes inactivos tras 30s
  max: 10,                         // Límite de conexiones (Neon free tier)
  keepAlive: true,
});

pool.on("connect", () => {
  console.log("✅ Conectado correctamente a la base de datos Neon");
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en el cliente PostgreSQL:", err);
});

// Códigos de error que indican problema de conexión y se deben reintentar
const CONNECTION_ERRORS = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
]);

const isConnectionError = (err) =>
  CONNECTION_ERRORS.has(err.code) ||
  (err.message && /timeout|connection|ECONNR/i.test(err.message));

// Sobreescribir pool.query para agregar reintentos automáticos en todos los modelos
const originalQuery = pool.query.bind(pool);
pool.query = async (text, paramsOrCallback, callback) => {
  // Si se usa la firma con callback, delegar sin reintentos
  if (typeof paramsOrCallback === "function" || typeof callback === "function") {
    return originalQuery(text, paramsOrCallback, callback);
  }

  const MAX_RETRIES = 3;
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await originalQuery(text, paramsOrCallback);
    } catch (err) {
      lastError = err;
      if (!isConnectionError(err) || attempt === MAX_RETRIES) throw err;
      const delay = attempt * 1000; // 1s → 2s → 3s
      console.warn(
        `⚠️  Error de conexión con Neon (intento ${attempt}/${MAX_RETRIES}). Reintentando en ${delay / 1000}s...`,
        err.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

export default pool;
