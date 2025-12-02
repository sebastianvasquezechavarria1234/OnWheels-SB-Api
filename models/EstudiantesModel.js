import pool from "../db/postgresPool.js";

//////////////////////////////////////////////////////////
// CREAR REGISTRO EN ESTUDIANTES (solo datos de estudiantes)
//////////////////////////////////////////////////////////

export const crearEstudiante = async (datos) => {
  const {
    id_usuario,
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente = null,
    estado_preinscripcion = "pendiente" // Valor por defecto
  } = datos;

  const query = `
    INSERT INTO estudiantes (
      id_usuario,
      enfermedad,
      nivel_experiencia,
      edad,
      id_acudiente,
      estado_preinscripcion
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    id_usuario,
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente,
    estado_preinscripcion
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

//////////////////////////////////////////////////////////
// OBTENER TODOS LOS ESTUDIANTES
//////////////////////////////////////////////////////////

export const obtenerEstudiantes = async () => {
  const query = `
    SELECT *
    FROM estudiantes
    ORDER BY id_estudiante ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

//////////////////////////////////////////////////////////
// OBTENER ESTUDIANTE POR ID
//////////////////////////////////////////////////////////

export const obtenerEstudiantePorId = async (id) => {
  const result = await pool.query(
    "SELECT * FROM estudiantes WHERE id_estudiante = $1",
    [id]
  );
  return result.rows[0];
};

//////////////////////////////////////////////////////////
// CREAR PREINSCRIPCIÓN (equivale a crear un estudiante con estado 'pendiente')
//////////////////////////////////////////////////////////

// Esta función puede ser la misma que crearEstudiante si se llama con estado_preinscripcion = 'pendiente'
// export const crearPreinscripcion = crearEstudiante; // Opción 1: Alias

// Opción 2: Función específica si se necesita lógica adicional
export const crearPreinscripcion = async (datos) => {
  // Asegura que el estado de preinscripción sea 'pendiente' al crearla
  const datosConEstadoPendiente = { ...datos, estado_preinscripcion: "pendiente" };
  return await crearEstudiante(datosConEstadoPendiente);
};

//////////////////////////////////////////////////////////
// OBTENER PREINSCRIPCIONES PENDIENTES (estudiantes con estado 'pendiente')
//////////////////////////////////////////////////////////

export const obtenerPreinscripcionesPendientes = async () => {
  const query = `
    SELECT *
    FROM estudiantes
    WHERE estado_preinscripcion = 'pendiente';
  `;
  const result = await pool.query(query);
  return result.rows;
};

//////////////////////////////////////////////////////////
// ACTUALIZAR ESTADO DE PREINSCRIPCIÓN
//////////////////////////////////////////////////////////

export const actualizarEstadoPreinscripcion = async (id, nuevoEstado) => {
  // Validar el nuevo estado aquí también si es necesario, aunque el controlador ya lo hace
  const query = `
    UPDATE estudiantes
    SET estado_preinscripcion = $1
    WHERE id_estudiante = $2 AND estado_preinscripcion = 'pendiente' -- Asegura que solo se actualice si está pendiente
    RETURNING *;
  `;

  const result = await pool.query(query, [nuevoEstado, id]);
  // Si result.rows[0] es undefined, significa que no se encontró o no se actualizó (por ejemplo, si ya no era 'pendiente')
  return result.rows[0];
};

//////////////////////////////////////////////////////////
// ACTUALIZAR ESTUDIANTE
//////////////////////////////////////////////////////////

export const actualizarEstudiante = async (id, datos) => {
  const {
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente,
    estado, // Estado general del estudiante
    estado_preinscripcion // Estado de la preinscripción
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
    updates.push(`id_acudiente = $${paramCounter}`);
    values.push(id_acudiente);
    paramCounter++;
  }
  if (estado !== undefined) {
    updates.push(`estado = $${paramCounter}`);
    values.push(estado);
    paramCounter++;
  }
  if (estado_preinscripcion !== undefined) {
    updates.push(`estado_preinscripcion = $${paramCounter}`);
    values.push(estado_preinscripcion);
    paramCounter++;
  }

  // Asegura que se esté actualizando al menos un campo
  if (updates.length === 0) {
    throw new Error("No hay campos para actualizar");
  }

  updates.push(`id_estudiante = $${paramCounter}`); // Añadir el ID al final para WHERE
  values.push(id);

  const query = `
    UPDATE estudiantes
    SET ${updates.slice(0, -1).join(', ')} -- Une los campos a actualizar (excepto el ID)
    WHERE id_estudiante = $${paramCounter} -- Usa el ID como condición WHERE
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};


//////////////////////////////////////////////////////////
// ELIMINAR ESTUDIANTE
//////////////////////////////////////////////////////////

export const eliminarEstudiante = async (id) => {
  const query = `
    DELETE FROM estudiantes
    WHERE id_estudiante = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// No olvides exportar todas las funciones si no lo haces con 'export default'
// export default {
//   crearEstudiante,
//   obtenerEstudiantes,
//   obtenerEstudiantePorId,
//   crearPreinscripcion, // Añadida
//   obtenerPreinscripcionesPendientes, // Añadida
//   actualizarEstadoPreinscripcion, // Añadida
//   actualizarEstudiante,
//   eliminarEstudiante,
// };