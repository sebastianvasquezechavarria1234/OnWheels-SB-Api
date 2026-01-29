// models/EstudiantesModel.js
import pool from "../db/postgresPool.js";

//////////////////////////////////////////////////////////
// CREAR REGISTRO EN ESTUDIANTES (para creación directa o en transacción)
//////////////////////////////////////////////////////////
export const crearEstudiante = async (datos, client = null) => {
  const {
    id_usuario,
    enfermedad = null,
    nivel_experiencia = null,
    edad = null,
    id_acudiente = null,
    estado = "Activo",
  } = datos;

  const db = client || pool; // ← Usa el cliente de transacción si se proporciona

  const usuarioCheck = await db.query("SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = true", [
    id_usuario,
  ]);

  if (usuarioCheck.rowCount === 0) {
    throw new Error("Usuario no encontrado o inactivo");
  }

  // Evitar duplicar preinscripción pendiente
  const preexistente = await db.query(
    "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $1 AND estado = 'Pendiente'",
    [id_usuario]
  );
  if (preexistente.rowCount > 0) {
    throw new Error("Ya tienes una preinscripción pendiente");
  }

  const query = `
    INSERT INTO estudiantes (
      id_usuario,
      enfermedad,
      nivel_experiencia,
      edad,
      fecha_preinscripcion,
      id_acudiente,
      estado
    )
    VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
    RETURNING *;
  `;

  const values = [id_usuario, enfermedad, nivel_experiencia, edad, id_acudiente, estado];
  const result = await db.query(query, values);
  return result.rows[0];
};

//////////////////////////////////////////////////////////
// CREAR PREINSCRIPCIÓN
//////////////////////////////////////////////////////////
export const crearPreinscripcion = async (datos, client = null) => {
  return await crearEstudiante({ ...datos, estado: "Pendiente" }, client);
};

//////////////////////////////////////////////////////////
// OBTENER TODOS LOS ESTUDIANTES ACTIVOS
//////////////////////////////////////////////////////////
export const obtenerEstudiantes = async () => {
  const query = `
    SELECT 
      e.*,
      u.nombre_completo,
      u.email,
      u.telefono,
      u.documento,
      u.tipo_documento,
      u.fecha_nacimiento,
      a.nombre_acudiente,
      a.telefono as telefono_acudiente,
      a.email as email_acudiente
    FROM estudiantes e
    INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN acudientes a ON e.id_acudiente = a.id_acudiente
    WHERE e.estado = 'Activo'
    ORDER BY e.id_estudiante ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// OBTENER ESTUDIANTES ACTIVOS (con indicador de matrícula activa)
export const obtenerEstudiantesConMatriculaActiva = async () => {
  const query = `
    SELECT 
      e.*,
      u.nombre_completo,
      u.email,
      u.documento,
      u.telefono,
      u.tipo_documento,
      u.fecha_nacimiento,
      a.nombre_acudiente,
      a.telefono as telefono_acudiente,
      a.email as email_acudiente,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM matriculas m WHERE m.id_estudiante = e.id_estudiante AND m.estado = 'Activa'
        ) THEN true
        ELSE false
      END AS tiene_matricula_activa
    FROM estudiantes e
    INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN acudientes a ON e.id_acudiente = a.id_acudiente
    WHERE e.estado = 'Activo'
    ORDER BY e.id_estudiante ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

//////////////////////////////////////////////////////////
// OBTENER PREINSCRIPCIONES PENDIENTES
//////////////////////////////////////////////////////////
export const obtenerPreinscripcionesPendientes = async () => {
  const query = `
    SELECT 
      e.*,
      u.nombre_completo,
      u.email,
      u.telefono,
      u.documento,
      u.tipo_documento,
      u.fecha_nacimiento,
      a.nombre_acudiente,
      a.telefono as telefono_acudiente,
      a.email as email_acudiente
    FROM estudiantes e
    INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN acudientes a ON e.id_acudiente = a.id_acudiente
    WHERE e.estado = 'Pendiente'
    ORDER BY e.fecha_preinscripcion DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

//////////////////////////////////////////////////////////
// OBTENER ESTUDIANTE POR ID (cualquier estado)
//////////////////////////////////////////////////////////
export const obtenerEstudiantePorId = async (id) => {
  const query = `
    SELECT 
      e.*,
      u.nombre_completo,
      u.email,
      u.telefono,
      u.documento,
      u.tipo_documento,
      u.fecha_nacimiento,
      a.nombre_acudiente,
      a.telefono as telefono_acudiente,
      a.email as email_acudiente
    FROM estudiantes e
    INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
    LEFT JOIN acudientes a ON e.id_acudiente = a.id_acudiente
    WHERE e.id_estudiante = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

//////////////////////////////////////////////////////////
// ACTUALIZAR ESTUDIANTE
//////////////////////////////////////////////////////////
export const actualizarEstudiante = async (id, datos) => {
  const { enfermedad, nivel_experiencia, edad, id_acudiente, estado } = datos;

  const updates = [];
  const values = [];
  let paramCounter = 1;

  if (enfermedad !== undefined) {
    updates.push(`enfermedad = $${paramCounter}`);
    values.push(enfermedad);
    paramCounter++;
  }
  if (nivel_experiencia !== undefined) {
    updates.push(`nivel_experiencia = $${paramCounter}`);
    values.push(nivel_experiencia);
    paramCounter++;
  }
  if (edad !== undefined) {
    updates.push(`edad = $${paramCounter}`);
    values.push(edad);
    paramCounter++;
  }
  if (id_acudiente !== undefined) {
    if (id_acudiente !== null) {
      const acudienteCheck = await pool.query("SELECT id_acudiente FROM acudientes WHERE id_acudiente = $1", [
        id_acudiente,
      ]);
      if (acudienteCheck.rowCount === 0) {
        throw new Error("Acudiente no encontrado");
      }
    }
    updates.push(`id_acudiente = $${paramCounter}`);
    values.push(id_acudiente);
    paramCounter++;
  }
  if (estado !== undefined) {
    updates.push(`estado = $${paramCounter}`);
    values.push(estado);
    paramCounter++;
  }

  if (updates.length === 0) {
    throw new Error("No hay campos para actualizar");
  }

  values.push(id);

  const updateQuery = `
    UPDATE estudiantes
    SET ${updates.join(", ")}
    WHERE id_estudiante = $${paramCounter}
    RETURNING *;
  `;

  const updateResult = await pool.query(updateQuery, values);

  if (updateResult.rowCount === 0) {
    return null;
  }

  return await obtenerEstudiantePorId(id);
};

//////////////////////////////////////////////////////////
// ACTUALIZAR ESTADO DE PREINSCRIPCIÓN
//////////////////////////////////////////////////////////
export const actualizarEstadoPreinscripcion = async (id, nuevoEstado) => {
  const estadosPermitidos = ["Activo", "Rechazado", "Pendiente"];
  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error("Estado no válido");
  }

  const updateResult = await pool.query(
    "UPDATE estudiantes SET estado = $1 WHERE id_estudiante = $2 RETURNING *",
    [nuevoEstado, id]
  );

  if (updateResult.rowCount === 0) {
    return null;
  }

  return await obtenerEstudiantePorId(id);
};

//////////////////////////////////////////////////////////
// ELIMINAR ESTUDIANTE
//////////////////////////////////////////////////////////
export const eliminarEstudiante = async (id) => {
  const check = await pool.query("SELECT id_estudiante FROM estudiantes WHERE id_estudiante = $1", [id]);
  if (check.rowCount === 0) {
    return null;
  }

  const query = `
    DELETE FROM estudiantes
    WHERE id_estudiante = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Verificar si un usuario YA TIENE registro en estudiantes (cualquier estado)
export const usuarioYaEsEstudiante = async (id_usuario) => {
  const query = `
    SELECT 1 FROM estudiantes WHERE id_usuario = $1;
  `;
  const result = await pool.query(query, [id_usuario]);
  return result.rowCount > 0;
};

// Verificar si un usuario ya es estudiante activo
export const esEstudianteActivo = async (id_usuario) => {
  const query = `
    SELECT 1 FROM estudiantes 
    WHERE id_usuario = $1 AND estado = 'Activo'
  `;
  const result = await pool.query(query, [id_usuario]);
  return result.rowCount > 0;
};