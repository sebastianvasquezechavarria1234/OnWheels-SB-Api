import pool from "../db/postgresPool.js";

// Obtener roles disponibles
export const getRolesDisponibles = async () => {
  const sql = `
    SELECT r.id_rol, r.nombre_rol, COUNT(ur.id_usuario) as cantidad_usuarios
    FROM roles r
    LEFT JOIN usuario_roles ur ON r.id_rol = ur.id_rol
    LEFT JOIN usuarios u ON ur.id_usuario = u.id_usuario
    WHERE u.estado = true OR u.estado IS NULL
    GROUP BY r.id_rol, r.nombre_rol
    ORDER BY r.nombre_rol;
  `;
  const { rows } = await pool.query(sql);
  return rows;
};

// Obtener correos por roles
export const getCorreosPorRoles = async (idsRoles) => {
  const sql = `
    SELECT DISTINCT u.id_usuario, u.nombre_completo, u.email as correo, r.nombre_rol
    FROM usuarios u
    INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
    INNER JOIN roles r ON ur.id_rol = r.id_rol
    WHERE ur.id_rol = ANY($1) 
      AND u.estado = true 
      AND u.email IS NOT NULL 
      AND u.email LIKE '%@%'
      AND u.email != '';
  `;
  const { rows } = await pool.query(sql, [idsRoles]);
  return rows;
};

// Obtener solo la cantidad de correos válidos por roles (más rápido que traer todo el detalle)
export const getCantidadCorreosPorRoles = async (idsRoles) => {
  const sql = `
    SELECT COUNT(DISTINCT u.id_usuario) AS total
    FROM usuarios u
    INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
    WHERE ur.id_rol = ANY($1)
      AND u.estado = true
      AND u.email IS NOT NULL
      AND u.email LIKE '%@%'
      AND u.email != '';
  `;
  const { rows } = await pool.query(sql, [idsRoles]);
  return Number(rows[0]?.total || 0);
};

// Crear registro de envío masivo
export const crearEnvioMasivo = async (asunto, mensaje, rolesStr, totalDestinatarios) => {
  const sql = `
    INSERT INTO envios_masivos (asunto, mensaje, roles_destino, total_destinatarios)
    VALUES ($1, $2, $3, $4)
    RETURNING *, roles_destino AS roles_destinatarios;
  `;
  const { rows } = await pool.query(sql, [asunto, mensaje, rolesStr, totalDestinatarios]);
  return rows[0];
};

// Insertar destinatarios (Optimizado con Bulk Insert)
export const insertarDestinatarios = async (idEnvio, destinatarios) => {
  if (destinatarios.length === 0) return;

  // Construir una sola consulta para insertar todos los destinatarios de una vez
  const values = [];
  const placeholders = [];
  
  destinatarios.forEach((dest, i) => {
    const offset = i * 4;
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    values.push(idEnvio, dest.id_usuario, dest.correo, 'enviado');
  });

  const sql = `
    INSERT INTO envios_destinatarios (id_envio, id_usuario, correo, estado)
    VALUES ${placeholders.join(', ')};
  `;

  try {
    await pool.query(sql, values);
    console.log(`✅ ${destinatarios.length} destinatarios registrados en DB para el envío ${idEnvio}`);
  } catch (error) {
    console.error('❌ Error en el registro masivo de destinatarios:', error);
    throw error;
  }
};

// Obtener historial de envíos
export const getHistorialEnvios = async (limite = 50) => {
  const sql = `
    SELECT *, roles_destino AS roles_destinatarios 
    FROM envios_masivos
    ORDER BY fecha_envio DESC
    LIMIT $1;
  `;
  const { rows } = await pool.query(sql, [limite]);
  return rows;
};

// Obtener detalles de un envío
export const getDetallesEnvio = async (idEnvio) => {
  const sql = `SELECT * FROM envios_masivos WHERE id_envio = $1`;
  const { rows } = await pool.query(sql, [idEnvio]);
  return rows[0];
};

// Eliminar un envío
export const eliminarEnvio = async (idEnvio) => {
    const sql = `DELETE FROM envios_masivos WHERE id_envio = $1`;
    await pool.query(sql, [idEnvio]);
};
