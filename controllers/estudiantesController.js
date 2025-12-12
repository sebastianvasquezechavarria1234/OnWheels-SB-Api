// controllers/estudiantesController.js
import {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  actualizarEstudiante,
  eliminarEstudiante,
  esEstudianteActivo  
} from "../models/EstudiantesModel.js";

export const crear = async (req, res) => {
  try {
    const { id_usuario } = req.body;
    if (!id_usuario) {
      return res.status(400).json({ mensaje: "id_usuario es obligatorio" });
    }

    // 🔒 Prevención de duplicados: verificar si ya es estudiante
    const yaEsEstudiante = await esEstudianteActivo(id_usuario);
    if (yaEsEstudiante) {
      return res.status(409).json({ mensaje: "El usuario ya está registrado como estudiante." });
    }

    const nuevoEstudiante = await crearEstudiante(req.body);
    res.status(201).json({
      mensaje: "Estudiante creado correctamente",
      estudiante: nuevoEstudiante,
    });
  } catch (error) {
    console.error("Error al crear estudiante:", error);
    if (error.message.includes("Usuario no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al crear estudiante" });
  }
};

export const listar = async (req, res) => {
  try {
    const estudiantes = await obtenerEstudiantes(); // ← Incluye 'tiene_matricula_activa'
    res.status(200).json(estudiantes);
  } catch (error) {
    console.error("Error al listar estudiantes:", error);
    res.status(500).json({ mensaje: "Error al listar estudiantes" });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const estudiante = await obtenerEstudiantePorId(id);

    if (!estudiante) {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }

    // Solo mostrar estudiantes activos en el CRUD normal
    if (estudiante.estado !== "Activo") {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }

    res.status(200).json(estudiante);
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    res.status(500).json({ mensaje: "Error al obtener estudiante" });
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteActualizado = await actualizarEstudiante(id, req.body);

    if (!estudianteActualizado) {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }

    res.status(200).json({
      mensaje: "Estudiante actualizado correctamente",
      estudiante: estudianteActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    if (error.message.includes("Acudiente no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al actualizar estudiante" });
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteEliminado = await eliminarEstudiante(id);

    if (!estudianteEliminado) {
      return res.status(404).json({ mensaje: "Estudiante no encontrado" });
    }

    res.status(200).json({ mensaje: "Estudiante eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res.status(500).json({ mensaje: "Error al eliminar estudiante" });
  }
};