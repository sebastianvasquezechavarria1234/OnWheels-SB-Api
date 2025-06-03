// models/Usuario.js
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String, required: true },
  rol: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Usuarios", usuarioSchema);
