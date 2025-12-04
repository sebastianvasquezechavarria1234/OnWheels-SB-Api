// controllers/emailMasivoController.js
import pool from "../db/postgresPool.js";

// ✅ Obtener roles disponibles con conteo de usuarios
export const getRolesConUsuarios = async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.id_rol,
        r.nombre_rol,
        COUNT(u.id_usuario) as cantidad_usuarios
      FROM ROLES r
      LEFT JOIN USUARIOS u ON r.id_rol = u.id_rol_actual
      WHERE r.estado = 1 AND u.estado = 1
      GROUP BY r.id_rol, r.nombre_rol
      ORDER BY r.nombre_rol;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener roles:", err);
    res.status(500).json({ msg: "Error al obtener roles", error: err.message });
  }
};

// ✅ Obtener usuarios por rol
export const getUsuariosPorRol = async (req, res) => {
  try {
    const { rol } = req.query;
    
    const sql = `
      SELECT u.id_usuario, u.email, u.nombre_completo, r.nombre_rol
      FROM USUARIOS u
      INNER JOIN ROLES r ON u.id_rol_actual = r.id_rol
      WHERE r.id_rol = $1 AND u.estado = 1
      ORDER BY u.nombre_completo;
    `;
    
    const { rows } = await pool.query(sql, [rol]);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener usuarios por rol:", err);
    res.status(500).json({ msg: "Error al obtener usuarios", error: err.message });
  }
};

// ✅ Enviar correo masivo por roles
export const enviarCorreoPorRoles = async (req, res) => {
  try {
    const { asunto, mensaje, roles } = req.body;

    if (!roles || roles.length === 0) {
      return res.status(400).json({ msg: "Selecciona al menos un rol" });
    }

    // 1. Obtener todos los usuarios de los roles seleccionados
    const placeholders = roles.map((_, i) => `$${i + 1}`).join(',');
    const usuariosSql = `
      SELECT u.id_usuario, u.email, u.nombre_completo, r.nombre_rol
      FROM USUARIOS u
      INNER JOIN ROLES r ON u.id_rol_actual = r.id_rol
      WHERE r.id_rol IN (${placeholders}) AND u.estado = 1
      ORDER BY r.nombre_rol, u.nombre_completo;
    `;
    
    const usuariosResult = await pool.query(usuariosSql, roles);
    const usuarios = usuariosResult.rows;

    if (usuarios.length === 0) {
      return res.status(404).json({ msg: "No hay usuarios en los roles seleccionados" });
    }

    // 2. Crear registro principal del envío
    const rolesNombresSql = `
      SELECT nombre_rol FROM ROLES WHERE id_rol IN (${placeholders})
    `;
    const rolesNombresResult = await pool.query(rolesNombresSql, roles);
    const rolesDestino = rolesNombresResult.rows.map(r => r.nombre_rol).join(',');

    const envioSql = `
      INSERT INTO ENVIOS_MASIVOS 
        (asunto, mensaje, total_destinatarios, roles_destino)
      VALUES ($1, $2, $3, $4)
      RETURNING id_envio;
    `;
    
    const envioResult = await pool.query(envioSql, [
      asunto,
      mensaje,
      usuarios.length,
      rolesDestino
    ]);
    
    const idEnvio = envioResult.rows[0].id_envio;

    // 3. Crear detalles para cada usuario
    const detallesValues = usuarios.map(u => 
      `(${idEnvio}, ${u.id_usuario}, '${u.email}', '${u.nombre_completo}', '${u.nombre_rol}')`
    ).join(',');
    
    const detallesSql = `
      INSERT INTO ENVIO_DESTINATARIOS 
        (id_envio, id_usuario, correo, nombre_usuario, rol_usuario)
      VALUES ${detallesValues};
    `;
    
    await pool.query(detallesSql);

    res.json({
      msg: "Envío programado correctamente",
      id_envio: idEnvio,
      totalDestinatarios: usuarios.length,
      roles: rolesDestino,
      estado: "pendiente"
    });

  } catch (err) {
    console.error("Error al registrar envío masivo:", err);
    res.status(500).json({ msg: "Error procesando envío", error: err.message });
  }
};

// ✅ Obtener historial de envíos
export const getHistorialEnvios = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id_envio,
        asunto,
        mensaje,
        roles_destino,
        total_destinatarios,
        estado,
        CONVERT(VARCHAR, fecha_envio, 120) as fecha_envio
      FROM ENVIOS_MASIVOS
      ORDER BY fecha_envio DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.status(500).json({ msg: "Error al obtener historial", error: err.message });
  }
};

// ✅ Obtener detalles de un envío específico
export const getDetalleEnvio = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        d.*,
        CONVERT(VARCHAR, d.fecha_envio, 120) as fecha_envio_detalle
      FROM ENVIO_DESTINATARIOS d
      WHERE d.id_envio = $1
      ORDER BY d.estado, d.nombre_usuario;
    `;
    
    const { rows } = await pool.query(sql, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener detalles:", err);
    res.status(500).json({ msg: "Error al obtener detalles", error: err.message });
  }
};