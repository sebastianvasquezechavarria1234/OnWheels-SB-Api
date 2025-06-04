import mongoose from "mongoose"

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/OnWheels-SB")
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`)
    console.log(`📊 Base de datos: ${conn.connection.name}`)
    return true
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message)
    process.exit(1) // Salir si no hay conexión a MongoDB
  }
}

export default connectDB
