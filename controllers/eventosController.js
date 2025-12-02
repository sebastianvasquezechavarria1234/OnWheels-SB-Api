// src/controllers/eventosController.js
import pool from "../db/postgresPool.js";
import Evento from "../models/Eventos.js";

// ✅ Obtener todos los eventos (con nombre de categoría)
export const getEventos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*, 
        c.nombre_categoria AS nombre_categoria
      FROM eventos e
      LEFT JOIN categorias_eventos c 
        ON e.id_categoria_evento = c.id_categoria_evento
      ORDER BY e.fecha_evento ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener eventos" });
  }
};

// ✅ Obtener un evento por ID
export const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        e.*, 
        c.nombre_categoria AS nombre_categoria
      FROM eventos e
      LEFT JOIN categorias_eventos c 
        ON e.id_categoria_evento = c.id_categoria_evento
      WHERE e.id_evento = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener el evento" });
  }
};

// ✅ Crear un nuevo evento
export const createEvento = async (req, res) => {
  try {
    const {
      id_categoria_evento,
      id_sede,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen, // ✅ Nombre corregido: "imagen" (no "imagen_evento")
      estado
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO eventos 
      (id_categoria_evento, id_sede, nombre_evento, fecha_evento, hora_inicio, hora_aproximada_fin, descripcion, imagen, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'activo'))
      RETURNING *
      `,
      [
        id_categoria_evento,
        id_sede,
        nombre_evento,
        fecha_evento,
        hora_inicio || null,
        hora_aproximada_fin || null,
        descripcion || null,
        imagen || null, // ✅ Usa "imagen"
        estado || "activo"
      ]
    );

    res.status(201).json(new Evento(result.rows[0]));
  } catch (err) {
    console.error("Error en createEvento:", err); // 👈 Mensaje más claro para depuración
    res.status(400).json({ mensaje: "Error al crear evento", error: err.message });
  }
};

// ✅ Actualizar evento
export const updateEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_categoria_evento,
      id_sede,
      nombre_evento,
      fecha_evento,
      hora_inicio,
      hora_aproximada_fin,
      descripcion,
      imagen, // ✅ Nombre corregido: "imagen"
      estado
    } = req.body;

    const result = await pool.query(
      `
      UPDATE eventos
      SET 
        id_categoria_evento = $1,
        id_sede = $2,
        nombre_evento = $3,
        fecha_evento = $4,
        hora_inicio = $5,
        hora_aproximada_fin = $6,
        descripcion = $7,
        imagen = $8, -- ✅ Usa "imagen"
        estado = $9
      WHERE id_evento = $10
      RETURNING *
      `,
      [
        id_categoria_evento,
        id_sede,
        nombre_evento,
        fecha_evento,
        hora_inicio || null,
        hora_aproximada_fin || null,
        descripcion || null,
        imagen || null, // ✅ Usa "imagen"
        estado,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    res.json({ mensaje: "Evento actualizado correctamente" });
  } catch (err) {
    console.error("Error en updateEvento:", err);
    res.status(400).json({ mensaje: "Error al actualizar evento", error: err.message });
  }
};

// ✅ Eliminar evento
export const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM eventos WHERE id_evento = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    res.json({ mensaje: "Evento eliminado correctamente" });
  } catch (err) {
    console.error("Error en deleteEvento:", err);
    res.status(500).json({ mensaje: "Error al eliminar evento", error: err.message });
  }
};