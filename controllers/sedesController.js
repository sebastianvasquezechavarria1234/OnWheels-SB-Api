// controllers/sedesController.js
import pool from "../db/postgresPool.js";

const validarCamposSede = (data) => {
  const errores = [];
  const { nombre_sede, direccion, ciudad, telefono } = data;

  if (!nombre_sede || typeof nombre_sede !== 'string' || nombre_sede.trim().length < 3) {
    errores.push("El nombre de la sede debe tener al menos 3 caracteres");
  }
  if (!direccion || typeof direccion !== 'string' || direccion.trim().length < 5) {
    errores.push("La dirección debe tener al menos 5 caracteres");
  }
  if (!ciudad || typeof ciudad !== 'string' || ciudad.trim().length < 2) {
    errores.push("La ciudad debe tener al menos 2 caracteres");
  }
  
  // Regex: acepta números, espacios, guiones, paréntesis y signo más. Longitud 7-20
  const phoneRegex = /^[0-9+\s()-]{7,20}$/;
  if (!telefono || typeof telefono !== 'string' || !phoneRegex.test(telefono.trim())) {
    errores.push("El teléfono es inválido (7-20 caracteres, números y símbolos comunes)");
  }

  return errores;
};

export const getSedes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_sede,
        COALESCE(nombre_sede, '') AS nombre_sede,
        COALESCE(direccion, '') AS direccion,
        COALESCE(ciudad, '') AS ciudad,
        COALESCE(telefono, '') AS telefono
      FROM sedes 
      ORDER BY nombre_sede ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error en getSedes:", error);
    res.status(500).json({ mensaje: "Error al obtener las sedes" });
  }
};

export const getSedeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM sedes WHERE id_sede = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en getSedeById:", error);
    res.status(500).json({ mensaje: "Error al obtener la sede" });
  }
};

export const createSede = async (req, res) => {
  try {
    const errores = validarCamposSede(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join("; ") });
    }

    const { nombre_sede, direccion, ciudad, telefono } = req.body;
    const result = await pool.query(
      `INSERT INTO sedes (nombre_sede, direccion, ciudad, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre_sede.trim(), direccion.trim(), ciudad.trim(), telefono]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en createSede:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const updateSede = async (req, res) => {
  try {
    const errores = validarCamposSede(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join("; ") });
    }

    const { id } = req.params;
    const { nombre_sede, direccion, ciudad, telefono } = req.body;

    const result = await pool.query(
      `UPDATE sedes
       SET nombre_sede = $1,
           direccion = $2,
           ciudad = $3,
           telefono = $4
       WHERE id_sede = $5
       RETURNING *`,
      [nombre_sede.trim(), direccion.trim(), ciudad.trim(), telefono, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" });
    }

    res.json({ mensaje: "Sede actualizada correctamente", sede: result.rows[0] });
  } catch (error) {
    console.error("❌ Error en updateSede:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const deleteSede = async (req, res) => {
  try {
    const { id } = req.params;

    const eventosAsociados = await pool.query(
      "SELECT COUNT(*) AS total FROM eventos WHERE id_sede = $1",
      [id]
    );

    if (Number(eventosAsociados.rows[0].total) > 0) {
      return res.status(409).json({
        mensaje: "No se puede eliminar la sede porque tiene eventos asociados"
      });
    }

    const result = await pool.query("DELETE FROM sedes WHERE id_sede = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Sede no encontrada" });
    }

    res.json({ mensaje: "Sede eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error en deleteSede:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};