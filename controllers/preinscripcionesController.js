//preinscripcionesController
import {
  crearPreinscripcion,
  obtenerPreinscripcionesPendientes,
  actualizarEstadoPreinscripcion,
  obtenerEstudiantePorId
} from "../models/estudiantesModel.js";

// Crear preinscripción
export const crearPreinscripcionCtrl = async (req, res) => {
  try {
    const { id_usuario } = req.body;
    if (!id_usuario) {
      return res.status(400).json({ mensaje: "id_usuario es obligatorio" });
    }

    const nuevaPreinscripcion = await crearPreinscripcion(req.body);
    res.status(201).json({
      mensaje: "Preinscripción creada correctamente",
      preinscripcion: nuevaPreinscripcion
    });
  } catch (error) {
    console.error("Error al crear preinscripción:", error);
    if (error.message.includes("Usuario no encontrado")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al crear preinscripción" });
  }
};

// Listar preinscripciones pendientes
export const listarPreinscripcionesPendientes = async (req, res) => {
  try {
    const preinscripciones = await obtenerPreinscripcionesPendientes();
    res.status(200).json(preinscripciones);
  } catch (error) {
    console.error("Error al listar preinscripciones pendientes:", error);
    res.status(500).json({ mensaje: "Error al listar preinscripciones pendientes" });
  }
};

// Obtener preinscripción por ID
export const obtenerPreinscripcionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const preinscripcion = await obtenerEstudiantePorId(id);
    
    if (!preinscripcion || preinscripcion.estado !== 'Pendiente') {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }
    
    res.status(200).json(preinscripcion);
  } catch (error) {
    console.error("Error al obtener preinscripción:", error);
    res.status(500).json({ mensaje: "Error al obtener preinscripción" });
  }
};

// Aprobar/Rechazar preinscripción
export const actualizarEstadoPreinscripcionCtrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ mensaje: "El campo 'estado' es obligatorio" });
    }

    const preinscripcionActualizada = await actualizarEstadoPreinscripcion(id, estado);
    if (!preinscripcionActualizada) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }
    
    res.status(200).json({
      mensaje: `Preinscripción ${estado === 'Activo' ? 'aprobada' : 'rechazada'} correctamente`,
      preinscripcion: preinscripcionActualizada
    });
  } catch (error) {
    console.error("Error al actualizar estado de preinscripción:", error);
    if (error.message.includes("Estado no válido")) {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al actualizar estado de preinscripción" });
  }
};