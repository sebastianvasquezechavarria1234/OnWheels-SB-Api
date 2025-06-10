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
  patrozinador: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    enum: ["programado", "en_curso", "finalizado", "cancelado"],
    default: "programado",
    required: true,
  }
})

export default mongoose.model("Eventos", eventosSchema)
