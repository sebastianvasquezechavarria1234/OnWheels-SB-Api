import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./db/postgresPool.js"; // POSTGRESQL

// Rutas
import variantesRoutes from "./routes/variantes.js";
import tallaRoutes from "./routes/tallas.js";
import colorRoutes from "./routes/colores.js";
import authRoutes from "./routes/authRoutes.js";
import matriculasRoutes from "./routes/matriculas.js";
import { actualizarMatriculasVencidas } from "./models/matriculasModel.js";
import preinscripcionesRoutes from "./routes/preinscripciones.js";
import planesClasesRoutes from "./routes/planes.js";
import nivelesClasesRoutes from "./routes/niveles.js";
import ventasRoutes from "./routes/ventas.js";
import pedidosRoutes from "./routes/pedidos.js";
import patrocinadoresRoutes from "./routes/patrocinadores.js";
import sedesRoutes from "./routes/sedes.js";
import comprasRoutes from "./routes/compras.js";
import categoriaproductosRoutes from "./routes/categoriaProductos.js";
import categoriaEventosRoutes from "./routes/categoriaEventos.js";
import productosRoutes from "./routes/productos.js";
import rolesRoutes from "./routes/roles.js";
import usuariosRoutes from "./routes/usuarios.js";
import eventosRoutes from "./routes/eventos.js";
import clasesRoutes from "./routes/clases.js";
import proveedoresRoutes from "./routes/proveedores.js";
import rolesPermisosRoutes from "./routes/rolesPermisos.js";
import permisosRoutes from "./routes/permisos.js";
import estudiantesRoutes from "./routes/estudiantes.js";
import acudientesRoutes from "./routes/acudientesRoutes.js";
import instructoresRoutes from "./routes/instructores.js";
import matriculasManualesRoutes from "./routes/matriculasManualesRoutes.js";
import clientesRoutes from "./routes/clientes.js";
import administradoresRouter from "./routes/administradores.js";
import emailMasivoRoutes from "./routes/emailMasivoRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Logger de diagnóstico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Definir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🧪 Probar conexión PostgreSQL
(async () => {
  try {
    const resPG = await pool.query("SELECT NOW() AS conectado");
    console.log("✅ Conectado a PostgreSQL:", resPG.rows[0]);
  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:", err);
  }

  // 📋 Auto-vencimiento: ejecutar al inicio y cada 6 horas
  try {
    const vencidas = await actualizarMatriculasVencidas();
    console.log(`📋 Auto-vencimiento inicial: ${vencidas} matrícula(s) actualizadas`);
  } catch (err) {
    console.error("❌ Error en auto-vencimiento inicial:", err.message);
  }
  setInterval(async () => {
    try {
      await actualizarMatriculasVencidas();
    } catch (err) {
      console.error("❌ Error en auto-vencimiento periódico:", err.message);
    }
  }, 6 * 60 * 60 * 1000); // cada 6 horas
})();

// 📌 Endpoint raíz
app.get("/", (req, res) => {
  res.json({
    mensaje: "🛹 OnWheels API - Dashboard Debugging",
    version: "1.0.0",
    storage: "PostgreSQL",
    endpoints: {
      usuarios: "/api/usuarios",
      eventos: "/api/eventos",
      clases: "/api/clases",
      roles: "/api/roles",
      categoriaEventos: "/api/categoria-eventos",
      categoriaProductos: "/api/categoria-productos",
      productos: "/api/productos",
      proveedores: "/api/proveedores",
      compras: "/api/compras",
      sedes: "/api/sedes",
      patrocinadores: "/api/patrocinadores",
      ventas: "/api/ventas",
      niveles: "/api/niveles",
      planes: "/api/planes",
      preinscripciones: "/api/preinscripciones",
      estudiantes: "/api/estudiantes",
      acudientes: "/api/acudientes",
      matriculas: "/api/matriculas",
      tallas: "/api/tallas",
      colores: "/api/colores",
      variantes: "/api/variantes",
      rolesPermisos: "/api/roles-permisos",
      permisos: "api/permisos",
      instructores: "/api/instructores",
      clientes: "/api/clientes-data", // ✅ Nombre actualizado
      administradores: "/api/administradores",
      dashboard: "/api/dashboard/stats"
    },
  });
});

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/roles-permisos", rolesPermisosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/permisos", permisosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/categorias-eventos", categoriaEventosRoutes);
app.use("/api/categoria-productos", categoriaproductosRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/sedes", sedesRoutes);
app.use("/api/patrocinadores", patrocinadoresRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/niveles", nivelesClasesRoutes);
app.use("/api/planes", planesClasesRoutes);
app.use("/api/preinscripciones", preinscripcionesRoutes);
app.use("/api/estudiantes", estudiantesRoutes);
app.use("/api/acudientes", acudientesRoutes);
app.use("/api/matriculas", matriculasRoutes);
app.use("/api/matriculas-manuales", matriculasManualesRoutes);
app.use("/api/tallas", tallaRoutes);
app.use("/api/colores", colorRoutes);
app.use("/api/variantes", variantesRoutes);
app.use("/api/instructores", instructoresRoutes);
app.use("/api/clientes-data", clientesRoutes);
app.use("/api/administradores", administradoresRouter); // ✅ ¡Ruta corregida aquí!
app.use("/api/admin/correos-masivos", emailMasivoRoutes);
console.log("🛠️ Registrando ruta /api/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`🌐 OnWheels API corriendo en puerto ${PORT}`)
  console.log(`🗄️ Usando PostgreSQL`)
})

