// controllers/matriculasController.js
import {
  crearMatricula,
  obtenerMatriculas,
  obtenerMatriculaPorId,
  actualizarMatricula,
  eliminarMatricula,
} from "../models/matriculasModel.js";

// Crear matrícula (solo si el estudiante ya existe)
export const crear = async (req, res) => {
  try {
    const { id_estudiante, id_clase, id_plan } = req.body;
    if (!id_estudiante || !id_clase || !id_plan) {
      return res.status(400).json({
        mensaje: "id_estudiante, id_clase e id_plan son obligatorios",
      });
    }
    const nuevaMatricula = await crearMatricula(req.body);
    res.status(201).json({ mensaje: "Matrícula creada", matricula: nuevaMatricula });
  } catch (error) {
    console.error("Error al crear matrícula:", error);
    if (error.message.includes("no encontrado") || error.message.includes("activa")) {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al crear matrícula" });
  }
};

// Listar matrículas
export const listar = async (req, res) => {
  try {
    const matriculas = await obtenerMatriculas();
    res.json(matriculas);
  } catch (error) {
    console.error("Error al listar matrículas:", error);
    res.status(500).json({ mensaje: "Error al listar matrículas" });
  }
};

// Obtener por ID
export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const matricula = await obtenerMatriculaPorId(id);
    if (!matricula) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.json(matricula);
  } catch (error) {
    console.error("Error al obtener matrícula:", error);
    res.status(500).json({ mensaje: "Error al obtener matrícula" });
  }
};

// Actualizar
export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaActualizada = await actualizarMatricula(id, req.body);
    if (!matriculaActualizada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.json({ mensaje: "Matrícula actualizada", matricula: matriculaActualizada });
  } catch (error) {
    console.error("Error al actualizar matrícula:", error);
    res.status(400).json({ mensaje: error.message || "Error al actualizar matrícula" });
  }
};

// Eliminar
export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaEliminada = await eliminarMatricula(id);
    if (!matriculaEliminada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.json({ mensaje: "Matrícula eliminada" });
  } catch (error) {
    console.error("Error al eliminar matrícula:", error);
    res.status(500).json({ mensaje: "Error al eliminar matrícula" });
  }
};