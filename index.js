import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose" 

// Importar rutas
import usuariosRoutes from "./routes/usuarios.js"
import eventosRoutes from "./routes/eventos.js"
import clasesRoutes from "./routes/clases.js"
import productosRoutes from "./routes/productos.js"

dotenv.config()

// Conexión a Base de datos
const uri = `mongodb+srv://api-directo:kloe@cluster0.b4uonwn.mongodb.net/jwt-directo?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(uri)
  .then(() => console.log('✅ Base de datos conectada'))
  .catch(e => console.log('❌ error db:', e));

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

//Ruta de token
const verifyToken = require('./routes/validate-token');

    // Crear tokens
    const payload = { name: user.name, id: user._id };

    const accessToken = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // Guardar refreshToken (opcional)
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        error: null,
        data: {
            accessToken,
            refreshToken
        }
    });

    res.json({
        error: null,
        data: {
            accessToken,
            refreshToken
        }
    });



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
