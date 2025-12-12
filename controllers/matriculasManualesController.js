// controllers/matriculasManualesController.js
import pool from "../db/postgresPool.js";
import bcrypt from "bcrypt";

export const crearMatriculaManual = async (req, res) => {
  const client = await pool.connect();
  const { 
    // Datos del usuario
    nombre_completo,
    email,
    telefono,
    documento,
    tipo_documento,
    fecha_nacimiento,

    // Datos del estudiante
    edad,
    nivel_experiencia,
    enfermedad,
    id_acudiente,

    // Datos de la matrícula
    id_clase,
    id_plan,
    fecha_matricula
  } = req.body;

  try {
    await client.query("BEGIN");

    // Verificar si el usuario ya existe
    const usuarioExistente = await client.query(
      "SELECT id_usuario FROM usuarios WHERE documento = $1 OR email = $2",
      [documento, email]
    );

    let id_usuario;
    if (usuarioExistente.rowCount > 0) {
      id_usuario = usuarioExistente.rows[0].id_usuario;
    } else {
      // Crear nuevo usuario
      const hashedPassword = await bcrypt.hash("123456", 10); // Contraseña temporal
      const usuarioResult = await client.query(
        `INSERT INTO usuarios (
          nombre_completo, email, telefono, documento, tipo_documento, fecha_nacimiento, contrasena, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING id_usuario`,
        [nombre_completo, email, telefono, documento, tipo_documento, fecha_nacimiento, hashedPassword]
      );
      id_usuario = usuarioResult.rows[0].id_usuario;

      // Asignar rol "Estudiante"
      const rolEstudiante = await client.query(
        "SELECT id_rol FROM roles WHERE nombre_rol = 'Estudiante' AND estado = true"
      );
      if (rolEstudiante.rowCount > 0) {
        await client.query(
          "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
          [id_usuario, rolEstudiante.rows[0].id_rol]
        );
      }
    }

    // Verificar si ya es estudiante
    const estudianteExistente = await client.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $1 AND estado = 'Activo'",
      [id_usuario]
    );

    let id_estudiante;
    if (estudianteExistente.rowCount > 0) {
      id_estudiante = estudianteExistente.rows[0].id_estudiante;
    } else {
      // Crear estudiante
      const estudianteResult = await client.query(
        `INSERT INTO estudiantes (
          id_usuario, edad, nivel_experiencia, enfermedad, id_acudiente, estado
        ) VALUES ($1, $2, $3, $4, $5, 'Activo')
        RETURNING id_estudiante`,
        [id_usuario, edad, nivel_experiencia, enfermedad, id_acudiente]
      );
      id_estudiante = estudianteResult.rows[0].id_estudiante;
    }

    // Validar clase y plan
    const claseCheck = await client.query("SELECT id_clase FROM clases WHERE id_clase = $1", [id_clase]);
    if (claseCheck.rowCount === 0) {
      throw new Error("Clase no encontrada");
    }
    const planCheck = await client.query("SELECT id_plan FROM planes_clases WHERE id_plan = $1", [id_plan]);
    if (planCheck.rowCount === 0) {
      throw new Error("Plan no encontrado");
    }

    // Crear matrícula
    const matriculaResult = await client.query(
      `INSERT INTO matriculas (
        id_estudiante, id_clase, id_plan, fecha_matricula, estado
      ) VALUES ($1, $2, $3, $4, 'Activa')
      RETURNING *`,
      [id_estudiante, id_clase, id_plan, fecha_matricula]
    );

    await client.query("COMMIT");

    res.status(201).json({
      mensaje: "Matrícula manual creada correctamente",
      matricula: matriculaResult.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en matrícula manual:", error);
    res.status(500).json({ mensaje: error.message || "Error al crear matrícula manual" });
  } finally {
    client.release();
  }
};