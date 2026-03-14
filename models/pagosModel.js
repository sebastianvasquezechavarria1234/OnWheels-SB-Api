import db from "../db/postgresPool.js";

// models/pagosModel.js
export const registrarPago = async (matriculaId, datosPago) => {
  const { monto, nota, fecha } = datosPago;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Verificar tope máximo
    const matQuery = await client.query("SELECT precio_plan, total_pagado FROM matriculas WHERE id_matricula = $1", [matriculaId]);
    if (matQuery.rowCount === 0) throw new Error("Matrícula no encontrada");
    
    const { precio_plan, total_pagado } = matQuery.rows[0];
    const saldoPendiente = Number(precio_plan) - Number(total_pagado);

    if (Number(monto) > saldoPendiente) {
      throw new Error(`El pago (${monto}) excede el saldo pendiente (${saldoPendiente}).`);
    }

    // Insertar nuevo pago
    const insertQuery = `
      INSERT INTO pagos (matricula_id, monto, nota, fecha)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const resultPago = await client.query(insertQuery, [matriculaId, monto, nota, fecha || new Date()]);
    const pago = resultPago.rows[0];

    // Actualizar total pagado en matrícula
    const updateQuery = `
      UPDATE matriculas
      SET total_pagado = total_pagado + $1
      WHERE id_matricula = $2
      RETURNING *;
    `;
    const resultMatricula = await client.query(updateQuery, [monto, matriculaId]);
    
    // Check if the plan is fully paid and update status to finalizada if appropriate (optional business logic)
    // For now we just return both
    
    await client.query("COMMIT");
    return { pago, matricula: resultMatricula.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const obtenerPagosPorMatricula = async (matriculaId) => {
  const query = `
    SELECT * FROM pagos
    WHERE matricula_id = $1
    ORDER BY fecha DESC, created_at DESC;
  `;
  const result = await db.query(query, [matriculaId]);
  return result.rows;
};
