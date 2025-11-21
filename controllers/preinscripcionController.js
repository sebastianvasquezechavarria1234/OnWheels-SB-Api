import {
  crearPreinscripcion,
  obtenerPreinscripcionesPendientes,
  actualizarEstadoPreinscripcion,
  obtenerEstudiantePorId
} from "../models/estudiantesModel.js";


// Registrar preinscripción
export const registrarPreinscripcion = async (req, res) => {
  try {
    const nueva = await crearPreinscripcion(req.body);
    res.status(201).json({ mensaje: "Preinscripción registrada", data: nueva });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al registrar", error });
  }
};


// Listar todas las preinscripciones pendientes
export const listarPreinscripcionesPendientes = async (req, res) => {
  try {
    const lista = await obtenerPreinscripcionesPendientes();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al listar", error });
  }
};


// Aprobar o rechazar preinscripción
export const cambiarEstadoPreinscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'aceptado' o 'rechazado'

    if (!["aceptado", "rechazado"].includes(estado)) {
      return res.status(400).json({ mensaje: "Estado no válido" });
    }

    const actualizado = await actualizarEstadoPreinscripcion(id, estado);
    res.json({ mensaje: "Estado actualizado", data: actualizado });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar estado", error });
  }
};
