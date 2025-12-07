// controllers/preinscripcionesController.js
import {
  crearPreinscripcion,
  obtenerPreinscripcionesPendientes,
  obtenerEstudiantePorId,
} from "../models/EstudiantesModel.js";


//importar matricula model para crear matricula al aceptar preinscripcion
import { crearMatricula } from "../models/matriculasModel.js";
import pool from "../db/postgresPool.js"

// Crear preinscripción
export const crearPreinscripcionCtrl = async (req, res) => {
  try {
    const { id_usuario } = req.body
    if (!id_usuario) {
      return res.status(400).json({ mensaje: "id_usuario es obligatorio" })
    }

    const nuevaPreinscripcion = await crearPreinscripcion(req.body)
    res.status(201).json({
      mensaje: "Preinscripción creada correctamente",
      preinscripcion: nuevaPreinscripcion,
    })
  } catch (error) {
    console.error("Error al crear preinscripción:", error)
    if (error.message.includes("Usuario no encontrado")) {
      return res.status(404).json({ mensaje: error.message })
    }
    if (error.message.includes("Ya tienes una preinscripción pendiente")) {
      return res.status(409).json({ mensaje: error.message })
    }
    res.status(400).json({ mensaje: error.message || "Error al crear preinscripción" })
  }
}

// Listar preinscripciones pendientes
export const listarPreinscripcionesPendientes = async (req, res) => {
  try {
    const preinscripciones = await obtenerPreinscripcionesPendientes()
    res.status(200).json(preinscripciones)
  } catch (error) {
    console.error("Error al listar preinscripciones pendientes:", error)
    res.status(500).json({ mensaje: "Error al listar preinscripciones pendientes" })
  }
}

// Obtener preinscripción por ID
export const obtenerPreinscripcionPorId = async (req, res) => {
  try {
    const { id } = req.params
    const preinscripcion = await obtenerEstudiantePorId(id)

    if (!preinscripcion || preinscripcion.estado !== "Pendiente") {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" })
    }

    res.status(200).json(preinscripcion)
  } catch (error) {
    console.error("Error al obtener preinscripción:", error)
    res.status(500).json({ mensaje: "Error al obtener preinscripción" })
  }
}

// Rechazar preinscripción
export const rechazarPreinscripcion = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      "UPDATE estudiantes SET estado = 'Rechazado' WHERE id_estudiante = $1 RETURNING *",
      [id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" })
    }
    res.status(200).json({ mensaje: "Preinscripción rechazada correctamente" })
  } catch (error) {
    console.error("Error al rechazar preinscripción:", error)
    res.status(500).json({ mensaje: "Error al rechazar preinscripción" })
  }
}

// Aceptar preinscripción y crear matrícula
export const aceptarPreinscripcionYCrearMatricula = async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const { id } = req.params
    const { id_clase, id_plan, fecha_matricula } = req.body

    if (!id_clase || !id_plan) {
      await client.query("ROLLBACK")
      return res.status(400).json({
        mensaje: "id_clase e id_plan son obligatorios para crear la matrícula",
      })
    }

    // 1. Obtener preinscripción
    const preinscripcion = await obtenerEstudiantePorId(id)
    if (!preinscripcion || preinscripcion.estado !== "Pendiente") {
      await client.query("ROLLBACK")
      return res.status(404).json({ mensaje: "Preinscripción no encontrada o ya procesada" })
    }

    // 2. Validar clase y plan
    const clase = await client.query("SELECT id_clase FROM clases WHERE id_clase = $1 AND estado = 'Disponible'", [id_clase])
    if (clase.rowCount === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ mensaje: "Clase no disponible" })
    }

    const plan = await client.query("SELECT id_plan FROM planes_clases WHERE id_plan = $1", [id_plan])
    if (plan.rowCount === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ mensaje: "Plan no encontrado" })
    }

    // 3. Cambiar estado a Activo
    await client.query("UPDATE estudiantes SET estado = 'Activo' WHERE id_estudiante = $1", [id])

    // 4. Crear matrícula
    const matricula = await crearMatricula({
      id_estudiante: id,
      id_clase,
      id_plan,
      fecha_matricula,
      estado: "Activa"
    })

    // 5. Asignar rol "Estudiante"
    const rolEstudiante = await client.query("SELECT id_rol FROM roles WHERE nombre_rol = 'Estudiante' AND estado = true")
    if (rolEstudiante.rowCount > 0) {
      await client.query(
        `INSERT INTO usuario_roles (id_usuario, id_rol) 
         VALUES ($1, $2) 
         ON CONFLICT (id_usuario, id_rol) DO NOTHING`,
        [preinscripcion.id_usuario, rolEstudiante.rows[0].id_rol]
      )
    }

    await client.query("COMMIT")

    res.status(200).json({
      mensaje: "Preinscripción aceptada y matrícula creada correctamente",
      matricula
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error al aceptar preinscripción:", error)
    res.status(500).json({
      mensaje: error.message || "Error al aceptar preinscripción"
    })
  } finally {
    client.release()
  }
}