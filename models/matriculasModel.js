// models/MatriculasModel.js
import pool from "../db/postgresPool.js";

// CREAR MATRÍCULA
export const crearMatricula = async (datos) => {
  const { id_estudiante, id_clase, id_plan } = datos;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validar que el estudiante no tenga matrícula activa
    const matriculaActiva = await client.query(
      "SELECT id_matricula FROM matriculas WHERE id_estudiante = $1 AND estado = 'Activa'",
      [id_estudiante]
    );
    if (matriculaActiva.rowCount > 0) {
      throw new Error("El estudiante ya tiene una matrícula activa.");
    }

    // Validar existencia
    const estudianteCheck = await client.query("SELECT id_estudiante FROM estudiantes WHERE id_estudiante = $1", [id_estudiante]);
    if (estudianteCheck.rowCount === 0) throw new Error("Estudiante no encontrado");
    
    const claseCheck = await client.query("SELECT id_clase FROM clases WHERE id_clase = $1", [id_clase]);
    if (claseCheck.rowCount === 0) throw new Error("Clase no encontrada");
    
    const planCheck = await client.query("SELECT id_plan, precio, duracion_meses FROM planes_clases WHERE id_plan = $1", [id_plan]);
    if (planCheck.rowCount === 0) throw new Error("Plan no encontrado");
    const planResult = planCheck.rows[0];

    // Crear matrícula (fecha automática)
    const query = `
      INSERT INTO matriculas (
        id_estudiante,
        id_clase,
        id_plan,
        estado,
        fecha_inicio,
        fecha_fin,
        precio_plan,
        total_pagado
      )
      VALUES ($1, $2, $3, 'Activa', CURRENT_DATE, CURRENT_DATE + ($4 * interval '1 month'), $5, 0)
      RETURNING *;
    `;

    const result = await client.query(query, [id_estudiante, id_clase, id_plan, planResult.duracion_meses, planResult.precio]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// AUTO-VENCIMIENTO: Marca como 'Vencida' las matrículas cuya fecha_fin ya pasó
export const actualizarMatriculasVencidas = async () => {
  const result = await pool.query(`
    UPDATE matriculas
    SET estado = 'Vencida'
    WHERE estado = 'Activa'
      AND fecha_fin < CURRENT_DATE
    RETURNING id_matricula
  `);
  if (result.rowCount > 0) {
    console.log(`📋 Auto-vencimiento: ${result.rowCount} matrícula(s) marcadas como Vencida`);
  }
  return result.rowCount;
};

// PAUSAR MATRÍCULA: Cambia el estado a 'Pausada' y guarda la fecha y motivo de la pausa
export const pausarMatricula = async (id, motivo) => {
  const result = await pool.query(
    "UPDATE matriculas SET estado = 'Pausada', fecha_pausa = CURRENT_DATE, motivo_pausa = $1 WHERE id_matricula = $2 AND estado = 'Activa' RETURNING *",
    [motivo, id]
  );
  if (result.rowCount === 0) throw new Error("No se pudo pausar. La matrícula no existe o no está activa.");
  return result.rows[0];
};

// REANUDAR MATRÍCULA: Reanuda una matrícula pausada y extiende la fecha_fin por los días que estuvo pausada
export const reanudarMatricula = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Obtener datos de la pausa
    const res = await client.query(
      "SELECT fecha_pausa, fecha_fin FROM matriculas WHERE id_matricula = $1 AND estado = 'Pausada'",
      [id]
    );
    if (res.rowCount === 0) throw new Error("La matrícula no está pausada o no existe.");
    const { fecha_pausa, fecha_fin } = res.rows[0];

    // Calcular días de pausa: HOY - fecha_pausa
    // Si se reanuda el mismo día, los días son 0
    const queryReanudar = `
      UPDATE matriculas 
      SET 
        estado = 'Activa',
        fecha_fin = fecha_fin + (CURRENT_DATE - fecha_pausa)::integer * interval '1 day',
        fecha_pausa = NULL
      WHERE id_matricula = $1
      RETURNING *
    `;
    const finalResult = await client.query(queryReanudar, [id]);
    
    await client.query("COMMIT");
    return finalResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// RENOVAR MATRÍCULA: Crea una nueva matrícula basada en una existente (mismo estudiante, clase y plan)
export const renovarMatricula = async (id_matricula_anterior, id_plan_nuevo = null) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Obtener la matrícula anterior
    const ant = await client.query(
      "SELECT id_estudiante, id_clase, id_plan, estado FROM matriculas WHERE id_matricula = $1",
      [id_matricula_anterior]
    );
    if (ant.rowCount === 0) throw new Error("Matrícula no encontrada");
    const anterior = ant.rows[0];

    // Permitir renovar solo si está Vencida o Finalizada
    if (anterior.estado === 'Activa') {
      throw new Error("La matrícula aún está activa, no necesita renovación");
    }

    const id_plan = id_plan_nuevo || anterior.id_plan;

    // Verificar que el estudiante no tenga otra matrícula activa
    const activa = await client.query(
      "SELECT id_matricula FROM matriculas WHERE id_estudiante = $1 AND estado = 'Activa'",
      [anterior.id_estudiante]
    );
    if (activa.rowCount > 0) {
      throw new Error("El estudiante ya tiene una matrícula activa");
    }

    // Obtener precio y duración del plan
    const plan = await client.query(
      "SELECT precio, duracion_meses FROM planes_clases WHERE id_plan = $1",
      [id_plan]
    );
    if (plan.rowCount === 0) throw new Error("Plan no encontrado");
    const { precio, duracion_meses } = plan.rows[0];

    // Crear nueva matrícula
    const nueva = await client.query(`
      INSERT INTO matriculas (
        id_estudiante, id_clase, id_plan,
        estado, fecha_inicio, fecha_fin,
        precio_plan, total_pagado
      )
      VALUES ($1, $2, $3, 'Activa', CURRENT_DATE,
              CURRENT_DATE + ($4 * interval '1 month'), $5, 0)
      RETURNING *
    `, [anterior.id_estudiante, anterior.id_clase, id_plan, duracion_meses, precio]);

    await client.query("COMMIT");
    return nueva.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// OBTENER TODAS LAS MATRÍCULAS (con clases restantes)
export const obtenerMatriculas = async () => {
  // Auto-marcar vencidas antes de devolver los datos
  await actualizarMatriculasVencidas();

  const query = `
    SELECT 
      m.*,
      e.id_usuario,
      u.nombre_completo,
      u.documento,
      u.email,
      c.dia_semana,
      c.hora_inicio,
      c.hora_fin,
      n.nombre_nivel,
      s.nombre_sede,
      p.nombre_plan,
      m.precio_plan,
      p.numero_clases,
      CASE 
        WHEN m.estado = 'Activa' THEN
          (
            SELECT COUNT(*)
            FROM generate_series(m.fecha_matricula, CURRENT_DATE, '1 day'::interval) AS dia
            WHERE EXTRACT(DOW FROM dia) = 
              CASE c.dia_semana
                WHEN 'Domingo' THEN 0
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
              END
          )
        ELSE
          NULL
      END AS clases_impartidas,
      CASE 
        WHEN m.estado = 'Activa' THEN
          GREATEST(0, p.numero_clases - (
            SELECT COUNT(*)
            FROM generate_series(m.fecha_matricula, CURRENT_DATE, '1 day'::interval) AS dia
            WHERE EXTRACT(DOW FROM dia) = 
              CASE c.dia_semana
                WHEN 'Domingo' THEN 0
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
              END
          ))
        ELSE
          NULL
      END AS clases_restantes
    FROM matriculas m
    INNER JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
    INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
    INNER JOIN clases c ON m.id_clase = c.id_clase
    INNER JOIN niveles_clases n ON c.id_nivel = n.id_nivel
    INNER JOIN sedes s ON c.id_sede = s.id_sede
    INNER JOIN planes_clases p ON m.id_plan = p.id_plan
    ORDER BY m.fecha_matricula DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// OBTENER MATRÍCULAS POR ESTUDIANTE
export const obtenerMatriculasPorEstudiante = async (id_estudiante) => {
  const query = `
    SELECT 
      m.*,
      c.dia_semana,
      c.hora_inicio,
      n.nombre_nivel,
      s.nombre_sede,
      p.nombre_plan,
      m.precio_plan,
      p.numero_clases,
      CASE 
        WHEN m.estado = 'Activa' THEN
          (
            SELECT COUNT(*)
            FROM generate_series(m.fecha_matricula, CURRENT_DATE, '1 day'::interval) AS dia
            WHERE EXTRACT(DOW FROM dia) = 
              CASE c.dia_semana
                WHEN 'Domingo' THEN 0
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
              END
          )
        ELSE
          NULL
      END AS clases_impartidas,
      CASE 
        WHEN m.estado = 'Activa' THEN
          GREATEST(0, p.numero_clases - (
            SELECT COUNT(*)
            FROM generate_series(m.fecha_matricula, CURRENT_DATE, '1 day'::interval) AS dia
            WHERE EXTRACT(DOW FROM dia) = 
              CASE c.dia_semana
                WHEN 'Domingo' THEN 0
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
              END
          ))
        ELSE
          NULL
      END AS clases_restantes
    FROM matriculas m
    INNER JOIN clases c ON m.id_clase = c.id_clase
    INNER JOIN niveles_clases n ON c.id_nivel = n.id_nivel
    INNER JOIN sedes s ON c.id_sede = s.id_sede
    INNER JOIN planes_clases p ON m.id_plan = p.id_plan
    WHERE m.id_estudiante = $1
    ORDER BY m.fecha_matricula DESC;
  `;
  const result = await pool.query(query, [id_estudiante]);
  return result.rows;
};

// Las demás funciones (obtenerPorId, actualizar, eliminar) permanecen igual
export const obtenerMatriculaPorId = async (id) => {
  const query = `
    SELECT 
      m.*,
      e.id_usuario,
      u.nombre_completo,
      u.documento,
      u.email,
      u.telefono,
      c.dia_semana,
      c.hora_inicio,
      c.descripcion as descripcion_clase,
      n.nombre_nivel,
      s.nombre_sede,
      s.direccion,
      p.nombre_plan,
      m.precio_plan,
      p.numero_clases
    FROM matriculas m
    INNER JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
    INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
    INNER JOIN clases c ON m.id_clase = c.id_clase
    INNER JOIN niveles_clases n ON c.id_nivel = n.id_nivel
    INNER JOIN sedes s ON c.id_sede = s.id_sede
    INNER JOIN planes_clases p ON m.id_plan = p.id_plan
    WHERE m.id_matricula = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const actualizarMatricula = async (id, datos) => {
  const { id_clase, id_plan, estado } = datos;

  const updates = [];
  const values = [];
  let paramCounter = 1;

  if (id_clase !== undefined) {
    const claseCheck = await pool.query("SELECT id_clase FROM clases WHERE id_clase = $1", [id_clase]);
    if (claseCheck.rowCount === 0) {
      throw new Error("Clase no encontrada");
    }
    updates.push(`id_clase = $${paramCounter}`);
    values.push(id_clase);
    paramCounter++;
  }

  if (id_plan !== undefined) {
    const planCheck = await pool.query("SELECT id_plan FROM planes_clases WHERE id_plan = $1", [id_plan]);
    if (planCheck.rowCount === 0) {
      throw new Error("Plan no encontrado");
    }
    updates.push(`id_plan = $${paramCounter}`);
    values.push(id_plan);
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
    UPDATE matriculas
    SET ${updates.join(", ")}
    WHERE id_matricula = $${paramCounter}
    RETURNING *;
  `;

  const updateResult = await pool.query(updateQuery, values);
  if (updateResult.rowCount === 0) {
    return null;
  }

  return await obtenerMatriculaPorId(id);
};

export const eliminarMatricula = async (id) => {
  const check = await pool.query("SELECT id_matricula FROM matriculas WHERE id_matricula = $1", [id]);
  if (check.rowCount === 0) {
    return null;
  }

  const query = `
    DELETE FROM matriculas
    WHERE id_matricula = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};