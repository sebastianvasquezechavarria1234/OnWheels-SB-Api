import pool from "../db/postgresPool.js";

//////////////////////////////////////////////////////////
// CREAR REGISTRO EN ESTUDIANTES (para creación directa)
//////////////////////////////////////////////////////////
export const crearEstudiante = async (datos) => {
  const {
    id_usuario,
    enfermedad = null,
    nivel_experiencia = null,
    edad = null,
    id_acudiente = null,
    estado = 'Activo'
  } = datos;

  // Verificar que el usuario exista
  const usuarioCheck = await pool.query(
    "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = true",
    [id_usuario]
  );
  
  if (usuarioCheck.rowCount === 0) {
    throw new Error("Usuario no encontrado o inactivo");
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

  const values = [
    id_usuario,
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente,
    estado
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

//////////////////////////////////////////////////////////
// CREAR PREINSCRIPCIÓN (estudiante con estado 'Pendiente')
//////////////////////////////////////////////////////////
export const crearPreinscripcion = async (datos) => {
  const {
    id_usuario,
    enfermedad = null,
    nivel_experiencia = null,
    edad = null,
    id_acudiente = null
  } = datos;

  // Verificar que el usuario exista
  const usuarioCheck = await pool.query(
    "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = true",
    [id_usuario]
  );
  
  if (usuarioCheck.rowCount === 0) {
    throw new Error("Usuario no encontrado o inactivo");
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
    VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'Pendiente')
    RETURNING *;
  `;

  const values = [
    id_usuario,
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
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
// ACTUALIZAR ESTUDIANTE - VERSIÓN SIMPLE Y SEGURA
//////////////////////////////////////////////////////////
export const actualizarEstudiante = async (id, datos) => {
  const {
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente,
    estado
  } = datos;

  // Construir la consulta dinámicamente para manejar posibles campos nulos
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
    // Verificar que el acudiente exista si se proporciona
    if (id_acudiente !== null) {
      const acudienteCheck = await pool.query(
        "SELECT id_acudiente FROM acudientes WHERE id_acudiente = $1",
        [id_acudiente]
      );
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

  // Asegura que se esté actualizando al menos un campo
  if (updates.length === 0) {
    throw new Error("No hay campos para actualizar");
  }

  values.push(id);

  // Actualiza solo la tabla estudiantes (sin RETURNING complejo)
  const updateQuery = `
    UPDATE estudiantes
    SET ${updates.join(', ')}
    WHERE id_estudiante = $${paramCounter}
    RETURNING *;
  `;

  const updateResult = await pool.query(updateQuery, values);
  
  if (updateResult.rowCount === 0) {
    return null;
  }

  // Obtiene los datos completos del estudiante actualizado
  return await obtenerEstudiantePorId(id);
};

//////////////////////////////////////////////////////////
// ACTUALIZAR ESTADO DE PREINSCRIPCIÓN - VERSIÓN SIMPLE
//////////////////////////////////////////////////////////
export const actualizarEstadoPreinscripcion = async (id, nuevoEstado) => {
  // Validar estados permitidos
  const estadosPermitidos = ['Activo', 'Rechazado', 'Pendiente'];
  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error("Estado no válido");
  }

  // Actualiza solo el estado
  const updateQuery = `
    UPDATE estudiantes
    SET estado = $1
    WHERE id_estudiante = $2
    RETURNING *;
  `;

  const updateResult = await pool.query(updateQuery, [nuevoEstado, id]);
  
  if (updateResult.rowCount === 0) {
    return null;
  }

  // Obtiene los datos completos del estudiante actualizado
  return await obtenerEstudiantePorId(id);
};

//////////////////////////////////////////////////////////
// ELIMINAR ESTUDIANTE
//////////////////////////////////////////////////////////
export const eliminarEstudiante = async (id) => {
  // Primero verificar que el estudiante exista
  const check = await pool.query(
    "SELECT id_estudiante FROM estudiantes WHERE id_estudiante = $1",
    [id]
  );
  
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