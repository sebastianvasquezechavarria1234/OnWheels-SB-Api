  // models/Instructores.js
  import mongoose from "mongoose";

  const instructorSchema = new mongoose.Schema({
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true
    },
    anios_experiencia: {
      type: Number,
      default: null
    },
    especialidad: {
      type: String,
      default: null
    },
    estado: {
      type: Boolean,
      default: true
    }
  }, {
    timestamps: true
  });

  export default mongoose .model("Instructor", instructorSchema);