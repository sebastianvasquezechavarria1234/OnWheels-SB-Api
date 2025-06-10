import mongoose from "mongoose"

const clasesSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  instructor: {
    type: String,
    required: true,
  },
  nivel: {
    type: String,
    required: true,
    enum: ["principiante", "intermedio", "avanzado", "todos"],
    default: "principiante",
  },
  horario: {
    type: String,
    required: true,
  },
  diasSemana: {
    type: [String],
    required: true,
    enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
  },
  ubicacion: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    enum: ["activa", "suspendida", "completa"],
    default: "activa",
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Clases", clasesSchema)
