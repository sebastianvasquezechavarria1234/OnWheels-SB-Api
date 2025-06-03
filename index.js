import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Usuarios from "./models/Usuarios.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB (sin useNewUrlParser ni useUnifiedTopology)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a mi primera API con MongoDB y Node.js!");
});

// ======================== CRUD USUARIOS ========================

// Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuarios.find();
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener los usuarios" });
  }
});

// Obtener un usuario por ID
app.get("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await Usuarios.findById(req.params.id);
    if (!usuario)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener el usuario" });
  }
});

// Crear un nuevo usuario
app.post("/usuarios", async (req, res) => {
  try {
    const nuevoUsuario = new Usuarios(req.body);
    const guardado = await nuevoUsuario.save();
    res.status(201).json(guardado);
  } catch (err) {
    console.error(err);
    // Si el email es duplicado, Mongoose lanzará un error por la opción unique: true
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ mensaje: "El email ya está registrado" });
    }
    res.status(400).json({ mensaje: "Error al crear el usuario", error: err.message });
  }
});

// Actualizar un usuario
app.put("/usuarios/:id", async (req, res) => {
  try {
    const actualizado = await Usuarios.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!actualizado)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(actualizado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: "Error al actualizar el usuario", error: err.message });
  }
});

// Eliminar un usuario
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const eliminado = await Usuarios.findByIdAndDelete(req.params.id);
    if (!eliminado)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al eliminar el usuario" });
  }
});

// Levantar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 La API está corriendo en http://localhost:${PORT}`);
});
