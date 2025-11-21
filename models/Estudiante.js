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
    estado_preinscripcion = "pendiente"
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
// ACTUALIZAR ESTUDIANTE
//////////////////////////////////////////////////////////

export const actualizarEstudiante = async (id, datos) => {
  const {
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente,
    estado,
    estado_preinscripcion
  } = datos;

  const query = `
    UPDATE estudiantes
    SET enfermedad = $1,
        nivel_experiencia = $2,
        edad = $3,
        id_acudiente = $4,
        estado = $5,
        estado_preinscripcion = $6
    WHERE id_estudiante = $7
    RETURNING *;
  `;

  const values = [
    enfermedad,
    nivel_experiencia,
    edad,
    id_acudiente,
    estado,
    estado_preinscripcion,
    id
  ];

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
