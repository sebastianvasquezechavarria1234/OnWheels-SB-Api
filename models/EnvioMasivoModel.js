import pool from "../db/postgresPool.js";

export const EmailMasivo = {
  crearEnvio: async (asunto, mensaje, total) => {
    const sql = `
      INSERT INTO envios_masivos (asunto, mensaje, total_destinatarios)
      VALUES ($1, $2, $3)
      RETURNING id_envio;
    `;
    const { rows } = await pool.query(sql, [asunto, mensaje, total]);
    return rows[0];
  },

  agregarDetalle: async (id_envio, correo, mensaje) => {
    const sql = `
      INSERT INTO envios_detalles (id_envio, correo, mensaje)
      VALUES ($1, $2, $3);
    `;
    return pool.query(sql, [id_envio, correo, mensaje]);
  },

  obtenerPendientes: async () => {
    const sql = `
      SELECT * FROM envios_detalles 
      WHERE estado = 'pendiente'
      LIMIT 20;
    `;
    const { rows } = await pool.query(sql);
    return rows;
  },

  marcarEnviado: (id_detalle) => {
    const sql = `UPDATE envios_detalles SET estado='enviado' WHERE id_detalle=$1`;
    return pool.query(sql, [id_detalle]);
  },

  marcarError: (id_detalle, error) => {
    const sql = `
      UPDATE envios_detalles 
      SET estado='error', error_msg=$2
      WHERE id_detalle=$1;
    `;
    return pool.query(sql, [id_detalle, error]);
  }
};
