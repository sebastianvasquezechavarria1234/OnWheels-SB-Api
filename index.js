// =====================
// DEPENDENCIAS
// =====================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Inicializar variables de entorno
dotenv.config();

// =====================
// CONEXIÓN A BASE DE DATOS
// =====================
import pool from "./db/postgresPool.js";

// =====================
// IMPORTAR RUTAS (ORDEN ALFABÉTICO)
// =====================
import acudientesRoutes from "./routes/acudientesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categoriaEventosRoutes from "./routes/categoriaEventos.js";
import categoriaproductosRoutes from "./routes/categoriaProductos.js";
import clasesRoutes from "./routes/clases.js";
import colorRoutes from "./routes/colores.js";
import comprasRoutes from "./routes/compras.js";
import estudiantesRoutes from "./routes/estudiantes.js";
import eventosRoutes from "./routes/eventos.js";
import matriculasRoutes from "./routes/matriculas.js";
import nivelesClasesRoutes from "./routes/nivelesClases.js";
import patrocinadoresRoutes from "./routes/patrocinadores.js";
import planesClasesRoutes from "./routes/planes.js";
import preinscripcionesRoutes from "./routes/preinscripciones.js";
import productosRoutes from "./routes/productos.js";
import proveedoresRoutes from "./routes/proveedores.js";
import rolesPermisosRoutes from "./routes/rolesPermisos.js";
import rolesRoutes from "./routes/roles.js";
import sedesRoutes from "./routes/sedes.js";
import tallaRoutes from "./routes/tallas.js";
import usuariosRoutes from "./routes/usuarios.js";
import variantesRoutes from "./routes/variantes.js";
import ventasRoutes from "./routes/ventas.js";
import emailMasivoRoutes from "./routes/emailMasivoRoutes.js";

// =====================
// CONFIGURACIÓN DE APP
// =====================
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// =====================
// RUTAS API (ORDEN ALFABÉTICO)
// =====================
app.use("/api/acudientes", acudientesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categorias-eventos", categoriaEventosRoutes);
app.use("/api/categoria-productos", categoriaproductosRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/colores", colorRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/estudiantes", estudiantesRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/matriculas", matriculasRoutes);
app.use("/api/niveles", nivelesClasesRoutes);
app.use("/api/patrocinadores", patrocinadoresRoutes);
app.use("/api/planes", planesClasesRoutes);
app.use("/api/preinscripciones", preinscripcionesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/roles-permisos", rolesPermisosRoutes);
app.use("/api/sedes", sedesRoutes);
app.use("/api/tallas", tallaRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/variantes", variantesRoutes);
app.use("/api/ventas", ventasRoutes);
app.use('/api/admin/correos-masivos', emailMasivoRoutes);

// =====================
// RUTA PRINCIPAL
// =====================
app.get("/", (req, res) => {
  res.json({
    mensaje: "🛹 Bienvenido a OnWheels Skateboard API",
    version: "1.0.0",
    storage: "PostgreSQL",
  });
});

// =====================
// TEST DE CONEXIÓN A DB
// =====================
(async () => {
  try {
    const res = await pool.query("SELECT NOW() AS conectado");
    console.log("✅ Conectado a PostgreSQL:", res.rows[0]);
  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:", err);
  }
})();

// =====================
// SERVIDOR
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
