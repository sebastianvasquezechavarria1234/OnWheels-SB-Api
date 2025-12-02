import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db/postgresPool.js"; 

import variantesRoutes from "./routes/variantes.js";
import tallaRoutes from "./routes/tallas.js";
import colorRoutes from "./routes/colores.js";
import authRoutes from "./routes/authRoutes.js";
import matriculasRoutes from "./routes/matriculas.js";
import preinscripcionesRoutes from "./routes/preinscripciones.js";
import planesClasesRoutes from "./routes/planes.js";
import nivelesClasesRoutes from "./routes/nivelesClases.js";
import ventasRoutes from "./routes/ventas.js";
import patrocinadoresRoutes from "./routes/patrocinadores.js";
import sedesRoutes from "./routes/sedes.js";
import emailRoutes from "./routes/emailMasivoRoutes.js";
import comprasRoutes from "./routes/compras.js";
import categoriaproductosRoutes from "./routes/categoriaProductos.js";
import categoriaEventosRoutes from "./routes/categoriaEventos.js";
import productosRoutes from "./routes/productos.js";
import rolesRoutes from "./routes/roles.js";
import eventosRoutes from "./routes/eventos.js";
import clasesRoutes from "./routes/clases.js";
import proveedoresRoutes from "./routes/proveedores.js";

dotenv.config();

const app = express();

// ✅ CORRECCIÓN CRÍTICA: middlewares ANTES de cualquier ruta
app.use(cors());
app.use(express.json()); // ← ESTO DEBE IR AQUÍ

// ✅ Ahora sí, todas las rutas
app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/clases", clasesRoutes);
app.use("/api/correos", enviarCorreosMasivos);
app.use("/api/categorias-eventos", categoriaEventosRoutes);
app.use("/api/categoria-productos", categoriaproductosRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/sedes", sedesRoutes);
app.use("/api/patrocinadores", patrocinadoresRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/niveles", nivelesClasesRoutes);
app.use("/api/planes", planesClasesRoutes);
app.use("/api/preinscripciones", preinscripcionesRoutes);
app.use("/api/matriculas", matriculasRoutes);
app.use("/api/tallas", tallaRoutes);
app.use("/api/colores", colorRoutes);
app.use("/api/variantes", variantesRoutes);
app.use("/emails", emailRoutes);


// Conexión a la base de datos
(async () => {
  try {
    const res = await pool.query("SELECT NOW() AS conectado");
    console.log("✅ Conectado a PostgreSQL:", res.rows[0]);
  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:", err);
  }
})();

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    mensaje: "🛹 Bienvenido a OnWheels Skateboard API",
    version: "1.0.0",
    storage: "PostgreSQL",
    endpoints: {
      usuarios: "/api/usuarios",
      eventos: "/api/eventos",
      clases: "/api/clases",
      roles: "/api/roles",
      productos: "/api/productos",
      proveedores: "/api/proveedores",
      categoriaEventos: "/api/categorias-eventos",
      categoriaProductos: "/api/categoriaProductos",
      compras: "/api/compras",
      sedes: "/api/sedes",
      patrocinadores: "/api/patrocinadores",
      ventas: "/api/ventas",
      niveles: "/api/niveles",
      planes: "/api/planes",
      preinscripciones: "/api/preinscripciones",
      matriculas: "/api/matriculas",
      tallas: "/api/tallas",
      colores: "/api/colores",
      variantes: "/api/variantes",
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 OnWheels API corriendo en puerto ${PORT}`);
  console.log(`🗄️ Usando PostgreSQL`);
});
import "./workers/emailWorker.js";import { enviarCorreosMasivos } from "./controllers/emailMasivoController.js";

