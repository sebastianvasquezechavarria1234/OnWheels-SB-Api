import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getPool } from "./db/mssqlPool.js";



// Importar rutas
import sedesRoutes from "./routes/sedes.js";  // Corregido
import comprasRoutes from "./routes/compras.js";  // Corregido
import categoriaproductosRoutes from "./routes/categoriaProductos.js";  // Corregido
import categoriaEventosRoutes from "./routes/categoriaEventos.js";  // Corregido
import productosRoutes from "./routes/productos.js";  // Corregido
import rolesRoutes from "./routes/roles.js";  // Correcto
import usuariosRoutes from "./routes/usuarios.js";
import eventosRoutes from "./routes/eventos.js";
import clasesRoutes from "./routes/clases.js";
import proveedoresRoutes from "./routes/proveedores.js"; 


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Probar conexión a SQL Server al arrancar
(async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT 1 AS conectado");
    console.log("✅ Conectado a SQL Server:", result.recordset[0]);
  } catch (err) {
    console.error("❌ Error conectando a SQL Server:", err);
  }
})();

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    mensaje: "🛹 Bienvenido a OnWheels Skateboard API",
    version: "1.0.0",
    storage: "SQL Server",
    endpoints: {
      usuarios: "/api/usuarios",
      eventos: "/api/eventos",
      clases: "/api/clases",
      roles: "/api/roles",
      productos: "/api/productos",
      proveedores: "/api/proveedores",
      categoriaEventos: "/api/categoriaEventos",
      categoriaProductos: "/api/categoriaProductos",
      compras: "/api/compras",
      sedes: "/api/sedes"
    },
  });
});

// Rutas de la API
app.use("/api/productos", productosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/categoria-eventos", categoriaEventosRoutes);
app.use("/api/categoria-productos", categoriaproductosRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/sedes", sedesRoutes);


// Levantar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 OnWheels API corriendo en puerto ${PORT}`);
  console.log(`🗄️ Usando SQL Server`);
});
