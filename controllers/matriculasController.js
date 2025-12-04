// src/controllers/matriculasController.js
import {
  crearMatricula,
  obtenerMatriculas,
  obtenerMatriculaPorId,
  actualizarMatricula,
  eliminarMatricula
} from "../models/matriculasModel.js";

// Crear matrícula
export const createMatricula = async (req, res) => {
  try {
    const {
      id_estudiante,
      id_clase,
      id_plan,
      fecha_matricula,
      metodo_pago
    } = req.body;

    if (!id_estudiante || !id_clase || !id_plan) {
      return res.status(400).json({ 
        mensaje: "id_estudiante, id_clase y id_plan son obligatorios" 
      });
    }

    const matriculaData = {
      id_estudiante: parseInt(id_estudiante),
      id_clase: parseInt(id_clase),
      id_plan: parseInt(id_plan),
      fecha_matricula: fecha_matricula || new Date().toISOString().split('T')[0]
    };

    const nuevaMatricula = await crearMatricula(matriculaData);
    res.status(201).json({
      mensaje: "Matrícula creada correctamente",
      matricula: nuevaMatricula
    });
  } catch (error) {
    console.error("Error creando matrícula:", error);
    if (error.message.includes("Estudiante no encontrado") || 
        error.message.includes("Clase no encontrada") || 
        error.message.includes("Plan no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error creando matrícula" });
  }
};

// Obtener todas las matrículas
export const getMatriculas = async (req, res) => {
  try {
    const matriculas = await obtenerMatriculas();
    res.json(matriculas);
  } catch (error) {
    console.error("Error obteniendo matrículas:", error);
    res.status(500).json({ mensaje: "Error obteniendo matrículas" });
  }
};

// Obtener matrícula por ID
export const getMatriculaById = async (req, res) => {
  try {
    const { id } = req.params;
    const matricula = await obtenerMatriculaPorId(id);
    
    if (!matricula) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    
    res.json(matricula);
  } catch (error) {
    console.error("Error obteniendo matrícula:", error);
    res.status(500).json({ mensaje: "Error obteniendo matrícula" });
  }
};

// Actualizar matrícula
export const updateMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaActualizada = await actualizarMatricula(id, req.body);
    
    if (!matriculaActualizada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    
    res.json({
      mensaje: "Matrícula actualizada correctamente",
      matricula: matriculaActualizada
    });
  } catch (error) {
    console.error("Error actualizando matrícula:", error);
    if (error.message.includes("Estudiante no encontrado") || 
        error.message.includes("Clase no encontrada") || 
        error.message.includes("Plan no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error actualizando matrícula" });
  }
};

// Eliminar matrícula
export const deleteMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaEliminada = await eliminarMatricula(id);
    
    if (!matriculaEliminada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    
    res.json({ mensaje: "Matrícula eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando matrícula:", error);
    res.status(500).json({ mensaje: "Error eliminando matrícula" });
  }
};