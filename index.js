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


// Conexión simple y compatible
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));
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

// ======================== CRUD CLASES ========================

app.get("/clases", (req, res) => {
    const data = readData();
    res.json(data.clases);
});

app.get("/clases/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const clases = data.clases.find((u) => u.id === id);
    res.json(clases);
});

app.post("/clases", (req, res) => {
    const data = readData();
    const body = req.body;
    const newClass = {
        id: data.clases.length + 1,
        ...body,
    };
    data.clases.push(newClass);
    writeData(data);
    res.json(newClass);
});

app.put("/clases/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const updatedClass = req.body;

    const index = data.clases.findIndex((u) => u.id === id);
    if (index === -1) {
        return res.status(404).json({ mensaje: "clase no encontrada" });
    }

    data.clases[index] = { id, ...updatedClass };
    writeData(data);
    res.json(data.clases[index]);
});

app.delete("/clases/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.clases.findIndex((u) => u.id === id);
    data.clases.splice(index, 1);
    writeData(data);
    res.json({ message: "la clase fue eliminada correctamente!" });
});



// ======================== CRUD productos ========================

app.get("/productos", (req, res) => {
    const data = readData();
    res.json(data.productos);
});

app.get("/productos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const productos = data.productos.find((e) => e.id === id);
    res.json(productos);
});

app.post("/productos", (req, res) => {
    const data = readData();
    const body = req.body;
    const newproducto = {
        id: data.productos.length + 1,
        ...body,
    };
    data.productos.push(newproducto);
    writeData(data);
    res.json(newproducto);
});

app.put("/productos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const updateproductos = req.body;

    const index = data.productos.findIndex((e) => e.id === id);
    if (index === -1) {
        return res.status(404).json({ mensaje: "El evento no ha sido encontrado" });
    }

    data.productos[index] = { id, ...updateproductos };
    writeData(data);
    res.json(data.productos[index]);
});

app.delete("/productos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.productos.findIndex((e) => e.id === id);

     if (index === -1) {
        return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    data.productos.splice(index, 1);
    writeData(data);
    res.json({ message: "El evento fue eliminado correctamente!" });
});


// Servidor
app.listen(3000, () => {
    console.log("La API está levantada en el puerto 3000");
});

