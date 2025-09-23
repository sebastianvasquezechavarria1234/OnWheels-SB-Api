// db/mssqlPool.js
import sql from "mssql";

const config = {
  user: "onwheels_user",       // tu usuario SQL Server
  password: "ONWHEELS123",     // tu contraseña
  server: "localhost",         // servidor (puede ser "localhost" o "DESKTOP-0JQL45K")
  database: "OnWheelsDB",      // tu base de datos
  options: {
    encrypt: false,            // desactiva en local
    trustServerCertificate: true
  },
  port: 1433                   // 👈 asegúrate de tener este puerto
};

let pool;

export const getPool = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log("✅ Conectado a SQL Server");
    }
    return pool;
  } catch (err) {
    console.error("❌ Error en conexión:", err);
    throw err;
  }
};
