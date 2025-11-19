import pool from "../db/postgresPool.js";

export const crearEstudiante = async (datos) => {
  const {
    nombre,
    apellido,
    documento,
    correo,
    telefono,
    direccion,
    fecha_nacimiento,
    estado = "pendiente",
  } = datos;

  const query = `
    INSERT INTO estudiantes (
      nombre, apellido, documento, correo, telefono,
      direccion, fecha_nacimiento, estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const values = [
    nombre,
    apellido,
    documento,
    correo,
    telefono,
    direccion,
    fecha_nacimiento,
    estado,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Obtener todos los estudiantes
export const obtenerEstudiantes = async () => {
  const result = await pool.query("SELECT * FROM estudiantes ORDER BY id_estudiante ASC");
  return result.rows;
};

// Obtener estudiante por ID
export const obtenerEstudiantePorId = async (id) => {
  const result = await pool.query("SELECT * FROM estudiantes WHERE id_estudiante = $1", [id]);
  return result.rows[0];
};

// Actualizar estudiante
export const actualizarEstudiante = async (id, datos) => {
  const {
    nombre,
    apellido,
    correo,
    telefono,
    direccion,
    fecha_nacimiento,
    estado,
  } = datos;

  const query = `
    UPDATE estudiantes
    SET nombre = $1, apellido = $2, correo = $3, telefono = $4,
        direccion = $5, fecha_nacimiento = $6, estado = $7
    WHERE id_estudiante = $8
    RETURNING *;
  `;

  const values = [nombre, apellido, correo, telefono, direccion, fecha_nacimiento, estado, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Eliminar estudiante
export const eliminarEstudiante = async (id) => {
  const result = await pool.query("DELETE FROM estudiantes WHERE id_estudiante = $1 RETURNING *", [id]);
  return result.rows[0];
};
