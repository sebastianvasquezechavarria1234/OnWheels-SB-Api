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
    enum: ["tablas", "ruedas", "trucks", "rodamientos", "protecciones", "ropa", "accesorios", "otros"],
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
  especificaciones: {
    talla: String,
    color: String,
    material: String,
    peso: String,
    dimensiones: String,
  },
  descuento: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  disponible: {
    type: Boolean,
    default: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Productos", productosSchema)
