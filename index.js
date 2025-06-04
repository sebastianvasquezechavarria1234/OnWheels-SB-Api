import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/database.js"

// Importar rutas
import usuariosRoutes from "./routes/usuarios.js"
import eventosRoutes from "./routes/eventos.js"
import clasesRoutes from "./routes/clases.js"
import productosRoutes from "./routes/productos.js"

dotenv.config()

// Conectar a MongoDB
connectDB()

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    mensaje: "🛹 Bienvenido a OnWheels Skateboard API",
    version: "1.0.0",
    storage: "MongoDB",
    endpoints: {
      usuarios: "/api/usuarios",
      eventos: "/api/eventos",
      clases: "/api/clases",
      productos: "/api/productos",
    },
  })
})

// Rutas de la API
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/eventos", eventosRoutes)
app.use("/api/clases", clasesRoutes)
app.use("/api/productos", productosRoutes)

// Levantar el servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🌐 OnWheels API corriendo en puerto ${PORT}`)
  console.log(`🍃 Usando MongoDB exclusivamente`)
})
