import mongoose from "mongoose"

const eventosSchema = new mongoose.Schema({
  imagen: {
    type: String,
    required: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  ubicacion: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  hora: {
    type: String,
    required: true,
  },
  patrocinador: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    enum: ["Programado", "Finalizado", "Cancelado"],
    default: "Programado",
    required: true,
  }
})

export default mongoose.model("Eventos", eventosSchema)
