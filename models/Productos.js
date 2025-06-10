import mongoose from "mongoose"

const productosSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  categoria: {
    type: String,
    required: true,
  },
  marca: {
    type: String,
    required: true,
  },
  precio: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  imagenes: [
    {
      type: String,
    },
  ],
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Productos", productosSchema)
