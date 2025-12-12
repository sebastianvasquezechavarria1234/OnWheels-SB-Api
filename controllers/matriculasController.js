// controllers/matriculasController.js
import {
  crearMatricula,
  obtenerMatriculas,
  obtenerMatriculaPorId,
  actualizarMatricula,
  eliminarMatricula,
} from "../models/matriculasModel.js";

import pool from "../db/postgresPool.js";
import { crearEstudiante } from "../models/EstudiantesModel.js";

// ====== RUTAS EXISTENTES ======
export const crear = async (req, res) => {
  try {
    const { id_estudiante, id_clase, id_plan } = req.body;
    if (!id_estudiante || !id_clase || !id_plan) {
      return res.status(400).json({
        mensaje: "id_estudiante, id_clase e id_plan son obligatorios",
      });
    }
    const nuevaMatricula = await crearMatricula(req.body);
    res.status(201).json({
      mensaje: "Matrícula creada correctamente",
      matricula: nuevaMatricula,
    });
  } catch (error) {
    console.error("Error al crear matrícula:", error);
    if (error.message.includes("no encontrado") || error.message.includes("no está activo")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al crear matrícula" });
  }
};

export const listar = async (req, res) => {
  try {
    const matriculas = await obtenerMatriculas();
    res.status(200).json(matriculas);
  } catch (error) {
    console.error("Error al listar matrículas:", error);
    res.status(500).json({ mensaje: "Error al listar matrículas" });
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const matricula = await obtenerMatriculaPorId(id);
    if (!matricula) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.status(200).json(matricula);
  } catch (error) {
    console.error("Error al obtener matrícula:", error);
    res.status(500).json({ mensaje: "Error al obtener matrícula" });
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaActualizada = await actualizarMatricula(id, req.body);
    if (!matriculaActualizada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.status(200).json({
      mensaje: "Matrícula actualizada correctamente",
      matricula: matriculaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar matrícula:", error);
    if (error.message.includes("no encontrada")) {
      return res.status(404).json({ mensaje: error.message });
    }
    res.status(400).json({ mensaje: error.message || "Error al actualizar matrícula" });
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaEliminada = await eliminarMatricula(id);
    if (!matriculaEliminada) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }
    res.status(200).json({ mensaje: "Matrícula eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar matrícula:", error);
    res.status(500).json({ mensaje: "Error al eliminar matrícula" });
  }
};

// ====== NUEVA FUNCIÓN: CREAR MATRÍCULA MANUAL ======
export const crearMatriculaManual = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      id_usuario,
      enfermedad,
      nivel_experiencia,
      edad,
      acudiente_nombre,
      acudiente_telefono,
      acudiente_email,
      id_clase,
      id_plan
    } = req.body;

    if (!id_usuario || !id_clase || !id_plan) {
      return res.status(400).json({ mensaje: "id_usuario, id_clase e id_plan son obligatorios" });
    }

    await client.query("BEGIN");

    // Verificar que el usuario no sea estudiante ya
    const estudianteExiste = await client.query(
      "SELECT 1 FROM estudiantes WHERE id_usuario = $1",
      [id_usuario]
    );
    if (estudianteExiste.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ mensaje: "El usuario ya está registrado como estudiante." });
    }

    // Crear estudiante
    const estudianteResult = await client.query(
      `INSERT INTO estudiantes (
        id_usuario, enfermedad, nivel_experiencia, edad, fecha_preinscripcion, id_acudiente, estado
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6) RETURNING id_estudiante;`,
      [id_usuario, enfermedad || null, nivel_experiencia || null, edad ? parseInt(edad) : null, null, "Activo"]
    );
    const id_estudiante = estudianteResult.rows[0].id_estudiante;

    // Asignar rol 'estudiante'
    const rolEstudiante = await client.query(
      "SELECT id_rol FROM roles WHERE LOWER(TRIM(nombre_rol)) = 'estudiante'"
    );
    if (rolEstudiante.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(500).json({ mensaje: "Rol 'estudiante' no encontrado en la base de datos." });
    }
    const id_rol_estudiante = rolEstudiante.rows[0].id_rol;

    const yaTieneRol = await client.query(
      "SELECT 1 FROM usuario_roles WHERE id_usuario = $1 AND id_rol = $2",
      [id_usuario, id_rol_estudiante]
    );
    if (yaTieneRol.rowCount === 0) {
      await client.query(
        "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
        [id_usuario, id_rol_estudiante]
      );
    }

    // Crear matrícula
    const matriculaResult = await client.query(
      `INSERT INTO matriculas (id_estudiante, id_clase, id_plan, estado)
       VALUES ($1, $2, $3, 'Activa') RETURNING *;`,
      [id_estudiante, id_clase, id_plan]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Matrícula manual creada correctamente",
      matricula: matriculaResult.rows[0],
      id_estudiante
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error en crearMatriculaManual:", error);
    return res.status(500).json({ mensaje: error.message || "Error al crear matrícula manual" });
  } finally {
    client.release();
  }
};