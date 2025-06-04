import mongoose from "mongoose"

const eventosSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  hora: {
    type: String,
    required: true,
  },
  ubicacion: {
    type: String,
    required: true,
  },
  categoria: {
    type: String,
    required: true,
    enum: ["competencia", "exhibicion", "workshop", "festival", "otro"],
    default: "otro",
  },
  precio: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  capacidadMaxima: {
    type: Number,
    required: true,
    min: 1,
  },
  participantesInscritos: {
    type: Number,
    default: 0,
    min: 0,
  },
  imagen: {
    type: String,
    default: "",
  },
  organizador: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    enum: ["programado", "en_curso", "finalizado", "cancelado"],
    default: "programado",
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Eventos", eventosSchema)
