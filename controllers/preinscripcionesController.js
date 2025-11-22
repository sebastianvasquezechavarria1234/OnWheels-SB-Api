import {
  crearPreinscripcion,
  obtenerPreinscripcionesPendientes,
  actualizarEstadoPreinscripcion,
  obtenerEstudiantePorId,
} from "../models/estudiantesModel.js"
import pool from "../db/postgresPool.js"

// Registrar preinscripción
export const registrarPreinscripcion = async (req, res) => {
  try {
    const nueva = await crearPreinscripcion(req.body)
    res.status(201).json({ mensaje: "Preinscripción registrada", data: nueva })
  } catch (error) {
    res.status(500).json({ mensaje: "Error al registrar", error })
  }
}

// Listar todas las preinscripciones pendientes
export const listarPreinscripcionesPendientes = async (req, res) => {
  try {
    const lista = await obtenerPreinscripcionesPendientes()
    res.json(lista)
  } catch (error) {
    res.status(500).json({ mensaje: "Error al listar", error })
  }
}

// Aprobar o rechazar preinscripción
export const cambiarEstadoPreinscripcion = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body // 'aceptado' o 'rechazado'

    if (!["aceptado", "rechazado"].includes(estado)) {
      return res.status(400).json({ mensaje: "Estado no válido" })
    }

    if (estado === "aceptado") {
      // Get the student to find their user ID
      const estudiante = await obtenerEstudiantePorId(id)
      if (!estudiante) {
        return res.status(404).json({ mensaje: "Estudiante no encontrado" })
      }

      // Get the student role ID
      const rolResult = await pool.query(
        `SELECT id_rol FROM roles WHERE LOWER(nombre_rol) = LOWER($1) AND (estado IS NULL OR estado = true)`,
        ["estudiante"],
      )

      if (rolResult.rows.length === 0) {
        return res.status(500).json({ mensaje: "Rol de estudiante no encontrado en el sistema" })
      }

      const id_rol = rolResult.rows[0].id_rol

      // Check if the user already has the student role
      const existingRole = await pool.query(`SELECT * FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2`, [
        estudiante.id_usuario,
        id_rol,
      ])

      // Only add the role if they don't already have it
      if (existingRole.rows.length === 0) {
        await pool.query(`INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)`, [
          estudiante.id_usuario,
          id_rol,
        ])
      }
    }

    // Update preinscription status
    const actualizado = await actualizarEstadoPreinscripcion(id, estado)

    if (!actualizado) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada o no está pendiente" })
    }

    res.json({
      mensaje:
        estado === "aceptado"
          ? "Preinscripción aprobada. Rol de estudiante asignado al usuario."
          : "Preinscripción rechazada",
      data: actualizado,
    })
  } catch (error) {
    console.error("Error al cambiar estado de preinscripción:", error)
    res.status(500).json({ mensaje: "Error al actualizar estado", error: error.message })
  }
}
