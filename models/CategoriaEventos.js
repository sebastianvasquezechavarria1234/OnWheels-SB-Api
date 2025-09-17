import mongoose from "mongoose"

const categoriasSchema = new mongoose.Schema({
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

})

export default mongoose.model("CategoriaEventos", categoriasSchema)
