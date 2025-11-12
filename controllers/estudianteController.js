// controllers/estudiantesController.js
import {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  actualizarEstudiante,
  eliminarEstudiante,
} from "./../models/Estudiante.js";

export const crear = async (req, res) => {
  try {
    const nuevoEstudiante = await crearEstudiante(req.body);
    res.status(201).json(nuevoEstudiante);
  } catch (error) {
    console.error("Error al crear estudiante:", error);
    res.status(500).json({ mensaje: "Error al crear estudiante" });
  }
};

export const listar = async (req, res) => {
  try {
    const estudiantes = await obtenerEstudiantes();
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
    res.status(200).json(estudianteActualizado);
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    res.status(500).json({ mensaje: "Error al actualizar estudiante" });
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
