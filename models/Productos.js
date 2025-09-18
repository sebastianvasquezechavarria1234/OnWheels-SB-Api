
import mongoose from "mongoose"

const productosSchema = new mongoose.Schema({
  imagenes: [
    {
      type: String,
    },
  ],
  nombre: {
    type: String,
    required: true,
    trim: true,
  },

  categoria: {
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
     estado: {
    type: Boolean,
    required: true,
  },
  


})

export default mongoose.model("Productos", productosSchema)
