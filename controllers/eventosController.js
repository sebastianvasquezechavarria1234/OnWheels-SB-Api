// controllers/eventosController.js
import pool from "../db/postgresPool.js";
import { sendMassEventEmail } from "../services/emailService.js";

// ============================================
// Obtener todos los eventos
// ============================================
export const getEventos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        e.*,
        ce.nombre_categoria,
        s.nombre_sede,
        s.direccion
      FROM eventos e
      INNER JOIN categorias_eventos ce ON e.id_categoria_evento = ce.id_categoria_evento
      INNER JOIN sedes s ON e.id_sede = s.id_sede
      WHERE e.estado != 'inactivo'
      ORDER BY e.fecha_evento DESC, e.hora_inicio;
    `;

    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener eventos:", err);
    res.status(500).json({ msg: "Error al obtener eventos", error: err.message });
  }
};

// ============================================
// Obtener evento por ID
// ============================================
export const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        e.*,
        ce.nombre_categoria,
        s.nombre_sede,
        s.direccion,
        s.ciudad
      FROM eventos e
      INNER JOIN categorias_eventos ce ON e.id_categoria_evento = ce.id_categoria_evento
      INNER JOIN sedes s ON e.id_sede = s.id_sede
      WHERE e.id_evento = $1;
    `;

    const { rows } = await pool.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Evento no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error al obtener evento:", err);
    res.status(500).json({ msg: "Error al obtener evento", error: err.message });
  }
};

// ============================================
// Crear evento
// ============================================
// ============================================
// Crear evento
// ============================================
export const createEvento = async (req, res) => {
  try {
    const { 
      id_categoria_evento,
      id_sede,
      id_patrocinador, // Nuevo campo
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen, // Corregido de imagen_evento a imagen
      estado = "activo"
    } = req.body;

    // === VALIDACIONES DE DATOS ===
    // 1. Campos requeridos
    if (!id_categoria_evento || !id_sede || !nombre_evento || !fecha_evento || !hora_inicio || !hora_aproximada_fin) {
      return res.status(400).json({
        msg: "Faltan campos requeridos: categoría, sede, nombre, fecha, hora inicio/fin"
      });
    }

    // 2. Validar nombre (longitud y formato básico)
    if (nombre_evento.length < 5 || nombre_evento.length > 150) {
      return res.status(400).json({ msg: "El nombre debe tener entre 5 y 150 caracteres" });
    }

    // 3. Validar fecha (no puede ser anterior a hoy)
    const eventDate = new Date(fecha_evento);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear hora para comparar solo fechas
    // Ajuste de zona horaria si fuera necesario (asumimos UTC o local coherente)
    // Comparar timestamps
    const eventTimestamp = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
    const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    if (eventTimestamp < todayTimestamp) {
       return res.status(400).json({ msg: "La fecha del evento no puede ser en el pasado" });
    }

    // 4. Validar horas (inicio < fin)
    // Asumimos formato time 'HH:MM:SS' o similar comparable lexicográficamente
    if (hora_aproximada_fin <= hora_inicio) {
      return res.status(400).json({ msg: "La hora de fin debe ser posterior a la de inicio" });
    }

    // 5. Validar existencia de foraneas (opcional pero recomendado si no queremos confiar solo en error SQL)
    // Se puede confiar en el catch del error 23503, pero una validación explícita da mejor feedback
    // Por ahora dejaremos que el catch '23503' maneje la no existencia para evitar 3 queries extra.


    const sql = `
      INSERT INTO eventos 
        (id_categoria_evento, id_sede, id_patrocinador, nombre_evento, fecha_evento,
         hora_inicio, hora_aproximada_fin, descripcion, imagen, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const { rows } = await pool.query(sql, [
      id_categoria_evento,
      id_sede,
      id_patrocinador || null, // Manejar nulo si no viene
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen,
      estado
    ]);

    const nuevoEvento = rows[0];

    // Enviar correo masivo a todos los usuarios activos
    try {
      const usersRes = await pool.query("SELECT email FROM usuarios WHERE estado = true");
      const emails = usersRes.rows.map(row => row.email).filter(email => email);
      
      if (emails.length > 0) {
        sendMassEventEmail(nuevoEvento, emails).catch(err => console.error("Error envío masivo async:", err));
      }
    } catch (emailErr) {
      console.error("Error obteniendo emails para envío masivo:", emailErr);
    }

    res.status(201).json({
      msg: "Evento creado exitosamente",
      evento: nuevoEvento
    });
  } catch (err) {
    console.error("Error al crear evento:", err);

    if (err.code === "23503") {
      return res.status(400).json({
        msg: "Referencia inválida: Verifica que la categoría, sede o patrocinador existan"
      });
    }

    res.status(500).json({
      msg: "Error al crear evento",
      error: err.message
    });
  }
};

// ============================================
// Actualizar evento
// ============================================
export const updateEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const { 
      id_categoria_evento,
      id_sede,
      id_patrocinador,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen,
      estado
    } = req.body;

    const checkSql = `SELECT * FROM eventos WHERE id_evento = $1`;
    const check = await pool.query(checkSql, [id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ msg: "Evento no encontrado" });
    }

    const sql = `
      UPDATE eventos
      SET 
        id_categoria_evento = COALESCE($1, id_categoria_evento),
        id_sede = COALESCE($2, id_sede),
        id_patrocinador = COALESCE($3, id_patrocinador),
        nombre_evento = COALESCE($4, nombre_evento),
        fecha_evento = COALESCE($5, fecha_evento),
        hora_inicio = COALESCE($6, hora_inicio),
        hora_aproximada_fin = COALESCE($7, hora_aproximada_fin),
        descripcion = COALESCE($8, descripcion),
        imagen = COALESCE($9, imagen),
        estado = COALESCE($10, estado)
      WHERE id_evento = $11
      RETURNING *;
    `;

    const { rows } = await pool.query(sql, [
      id_categoria_evento,
      id_sede,
      id_patrocinador,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen,
      estado,
      id
    ]);

    res.json({
      msg: "Evento actualizado exitosamente",
      evento: rows[0]
    });
  } catch (err) {
    console.error("Error al actualizar evento:", err);

    if (err.code === "23503") {
      return res.status(400).json({
        msg: "Referencia inválida: Verifica que categoría, sede o patrocinador existan"
      });
    }

    res.status(500).json({
      msg: "Error al actualizar evento",
      error: err.message
    });
  }
};

// ============================================
// Eliminar (inactivar) evento
// ============================================
export const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE eventos
      SET estado = 'inactivo'
      WHERE id_evento = $1
      RETURNING id_evento, nombre_evento;
    `;

    const { rows } = await pool.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Evento no encontrado" });
    }

    res.json({
      msg: "Evento eliminado exitosamente",
      evento: rows[0]
    });
  } catch (err) {
    console.error("Error al eliminar evento:", err);
    res.status(500).json({ msg: "Error al eliminar evento", error: err.message });
  }
};

// ============================================
// Eventos por categoría
// ============================================
export const getEventosPorCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;

    const sql = `
      SELECT e.*, ce.nombre_categoria, s.nombre_sede
      FROM eventos e
      INNER JOIN categorias_eventos ce ON e.id_categoria_evento = ce.id_categoria_evento
      INNER JOIN sedes s ON e.id_sede = s.id_sede
      WHERE e.id_categoria_evento = $1 AND e.estado = 'activo'
      ORDER BY e.fecha_evento;
    `;

    const { rows } = await pool.query(sql, [categoriaId]);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener eventos por categoría:", err);
    res.status(500).json({ msg: "Error al obtener eventos", error: err.message });
  }
};

// ============================================
// Eventos futuros
// ============================================
export const getEventosFuturos = async (req, res) => {
  try {
    const sql = `
      SELECT e.*, ce.nombre_categoria, s.nombre_sede
      FROM eventos e
      INNER JOIN categorias_eventos ce ON e.id_categoria_evento = ce.id_categoria_evento
      INNER JOIN sedes s ON e.id_sede = s.id_sede
      WHERE e.fecha_evento >= CURRENT_DATE AND e.estado = 'activo'
      ORDER BY e.fecha_evento, e.hora_inicio
      LIMIT 10;
    `;

    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener eventos futuros:", err);
    res.status(500).json({ msg: "Error al obtener eventos", error: err.message });
  }
};
