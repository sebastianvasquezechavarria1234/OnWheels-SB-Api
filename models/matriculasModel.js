// src/models/matriculasModel.js
import pool from "../db/postgresPool.js";

// Crear matrícula
export const crearMatricula = async (datos) => {
  const {
    id_estudiante,
    id_clase,
    id_plan,
    fecha_matricula = new Date().toISOString().split('T')[0],
    estado = 'Activa'
  } = datos;

  // Validar que el estudiante exista y esté activo
  const estudianteCheck = await pool.query(
    "SELECT id_estudiante, estado FROM estudiantes WHERE id_estudiante = $1 AND estado = 'Activo'",
    [id_estudiante]
  );
  if (estudianteCheck.rowCount === 0) {
    throw new Error("Estudiante no encontrado o no está activo");
  }

  // Validar que la clase exista y esté disponible
  const claseCheck = await pool.query(
    "SELECT id_clase, estado FROM clases WHERE id_clase = $1 AND estado = 'Disponible'",
    [id_clase]
  );
  if (claseCheck.rowCount === 0) {
    throw new Error("Clase no encontrada o no está disponible");
  }

  // Validar que el plan exista
  const planCheck = await pool.query(
    "SELECT id_plan FROM planes_clases WHERE id_plan = $1",
    [id_plan]
  );
  if (planCheck.rowCount === 0) {
    throw new Error("Plan no encontrado");
  }

  const query = `
    INSERT INTO matriculas (
      id_estudiante,
      id_clase,
      id_plan,
      fecha_matricula,
      estado
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING 
      m.*,
      e.nombre_completo as nombre_estudiante,
      e.email as email_estudiante,
      c.nombre_clase,
      c.dia_semana,
      c.hora_inicio,
      c.hora_fin,
      p.nombre_plan,
      p.precio
    FROM matriculas m
    LEFT JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
    LEFT JOIN clases c ON m.id_clase = c.id_clase
    LEFT JOIN planes_clases p ON m.id_plan = p.id_plan
    WHERE m.id_matricula = (SELECT currval('matriculas_id_matricula_seq'));
  `;

  const values = [id_estudiante, id_clase, id_plan, fecha_matricula, estado];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Obtener todas las matrículas
export const obtenerMatriculas = async () => {
  const query = `
    SELECT 
      m.*,
      e.nombre_completo as nombre_estudiante,
      e.email as email_estudiante,
      e.documento as documento_estudiante,
      c.nombre_clase,
      c.dia_semana,
      c.hora_inicio,
      c.hora_fin,
      s.nombre_sede,
      p.nombre_plan,
      p.precio
    FROM matriculas m
    LEFT JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
    LEFT JOIN clases c ON m.id_clase = c.id_clase
    LEFT JOIN sedes s ON c.id_sede = s.id_sede
    LEFT JOIN planes_clases p ON m.id_plan = p.id_plan
    ORDER BY m.fecha_matricula DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Obtener matrícula por ID
export const obtenerMatriculaPorId = async (id) => {
  const query = `
    SELECT 
      m.*,
      e.nombre_completo as nombre_estudiante,
      e.email as email_estudiante,
      e.documento as documento_estudiante,
      c.nombre_clase,
      c.dia_semana,
      c.hora_inicio,
      c.hora_fin,
      s.nombre_sede,
      p.nombre_plan,
      p.precio
    FROM matriculas m
    LEFT JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
    LEFT JOIN clases c ON m.id_clase = c.id_clase
    LEFT JOIN sedes s ON c.id_sede = s.id_sede
    LEFT JOIN planes_clases p ON m.id_plan = p.id_plan
    WHERE m.id_matricula = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Actualizar matrícula
export const actualizarMatricula = async (id, datos) => {
  const {
    id_estudiante,
    id_clase,
    id_plan,
    fecha_matricula,
    estado
  } = datos;

  const updates = [];
  const values = [];
  let paramCounter = 1;

  if (id_estudiante !== undefined) {
    // Validar estudiante
    const estudianteCheck = await pool.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_estudiante = $1 AND estado = 'Activo'",
      [id_estudiante]
    );
    if (estudianteCheck.rowCount === 0) {
      throw new Error("Estudiante no encontrado o no está activo");
    }
    updates.push(`id_estudiante = $${paramCounter}`);
    values.push(id_estudiante);
    paramCounter++;
  }

  if (id_clase !== undefined) {
    // Validar clase
    const claseCheck = await pool.query(
      "SELECT id_clase FROM clases WHERE id_clase = $1 AND estado = 'Disponible'",
      [id_clase]
    );
    if (claseCheck.rowCount === 0) {
      throw new Error("Clase no encontrada o no está disponible");
    }
    updates.push(`id_clase = $${paramCounter}`);
    values.push(id_clase);
    paramCounter++;
  }

  if (id_plan !== undefined) {
    // Validar plan
    const planCheck = await pool.query(
      "SELECT id_plan FROM planes_clases WHERE id_plan = $1",
      [id_plan]
    );
    if (planCheck.rowCount === 0) {
      throw new Error("Plan no encontrado");
    }
    updates.push(`id_plan = $${paramCounter}`);
    values.push(id_plan);
    paramCounter++;
  }

  if (fecha_matricula !== undefined) {
    updates.push(`fecha_matricula = $${paramCounter}`);
    values.push(fecha_matricula);
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

  const query = `
    UPDATE matriculas
    SET ${updates.join(', ')}
    WHERE id_matricula = $${paramCounter}
    RETURNING 
      m.*,
      e.nombre_completo as nombre_estudiante,
      e.email as email_estudiante,
      c.nombre_clase,
      c.dia_semana,
      c.hora_inicio,
      c.hora_fin,
      s.nombre_sede,
      p.nombre_plan,
      p.precio
    FROM matriculas m
    LEFT JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
    LEFT JOIN clases c ON m.id_clase = c.id_clase
    LEFT JOIN sedes s ON c.id_sede = s.id_sede
    LEFT JOIN planes_clases p ON m.id_plan = p.id_plan
    WHERE m.id_matricula = $${paramCounter};
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Eliminar matrícula
export const eliminarMatricula = async (id) => {
  const query = "DELETE FROM matriculas WHERE id_matricula = $1 RETURNING *";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};