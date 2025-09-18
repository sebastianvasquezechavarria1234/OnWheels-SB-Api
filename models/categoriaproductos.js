import mongoose from "mongoose"

const categoriasSchema = new mongoose.Schema({
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

export default mongoose.model("CategoriaProductos", categoriasSchema)
