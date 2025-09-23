import express from "express";
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

const app = express();
const PORT = 3000;

// 🧪 Ruta de prueba de conexión a la BD
app.get("/test-db", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT GETDATE() AS fecha");
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error consultando la BD:", err.message); // mensaje limpio
    console.error("📋 Detalle completo:", err); // detalle técnico
    res.status(500).json({ error: "Error en la base de datos", detalle: err.message });
  }
});









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
      categorias: "/api/categorias",
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







// 🚀 Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
