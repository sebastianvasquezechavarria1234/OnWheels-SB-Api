// controllers/planesController.js
import pool from "../db/postgresPool.js";

// ✅ Obtener todos los planes
export const getPlanes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM planes_clases ORDER BY nombre_plan ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener planes:", err);
    res.status(500).json({ mensaje: "Error al obtener planes" });
  }
};

// ✅ Obtener plan por ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM planes_clases WHERE id_plan = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener plan:", err);
    res.status(500).json({ mensaje: "Error al obtener plan" });
  }
};

// ✅ Crear nuevo plan
export const createPlan = async (req, res) => {
  try {
    const { nombre_plan, descripcion, precio, descuento_porcentaje, numero_clases = 4 } = req.body;

    if (!nombre_plan || precio === undefined) {
      return res.status(400).json({ mensaje: "Nombre y precio son requeridos" });
    }

    const result = await pool.query(
      `INSERT INTO planes_clases (nombre_plan, descripcion, precio, descuento_porcentaje, numero_clases)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre_plan, descripcion, precio, descuento_porcentaje, numero_clases]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al crear plan:", err);
    res.status(400).json({ mensaje: "Error al crear plan", error: err.message });
  }
};

// ✅ Actualizar plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_plan, descripcion, precio, descuento_porcentaje, numero_clases } = req.body;

    const result = await pool.query(
      `UPDATE planes_clases
       SET nombre_plan = $1,
           descripcion = $2,
           precio = $3,
           descuento_porcentaje = $4,
           numero_clases = $5
       WHERE id_plan = $6
       RETURNING *`,
      [nombre_plan, descripcion, precio, descuento_porcentaje, numero_clases, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al actualizar plan:", err);
    res.status(400).json({ mensaje: "Error al actualizar plan", error: err.message });
  }
};

// ✅ Eliminar plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM planes_clases WHERE id_plan = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json({ mensaje: "Plan eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar plan:", err);
    res.status(500).json({ mensaje: "Error al eliminar plan" });
  }
};