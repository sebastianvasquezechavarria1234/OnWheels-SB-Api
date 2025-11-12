import pool from "../db/postgresPool.js";
import Plan from "../models/Planes.js";

// ✅ Obtener todos los planes
export const getPlanes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM planes ORDER BY nombre_plan ASC");
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
    const result = await pool.query("SELECT * FROM planes WHERE id_plan = $1", [id]);

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
    const { nombre_plan, descripcion, precio, duracion_meses } = req.body;

    const result = await pool.query(
      `INSERT INTO planes (nombre_plan, descripcion, precio, duracion_meses)
       VALUES ($1, $2, $3, $4)
       RETURNING id_plan`,
      [nombre_plan, descripcion, precio, duracion_meses]
    );

    const nuevoPlan = new Plan({
      id_plan: result.rows[0].id_plan,
      nombre_plan,
      descripcion,
      precio,
      duracion_meses
    });

    res.status(201).json(nuevoPlan);
  } catch (err) {
    console.error("❌ Error al crear plan:", err);
    res.status(400).json({ mensaje: "Error al crear plan", error: err.message });
  }
};

// ✅ Actualizar plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_plan, descripcion, precio, duracion_meses } = req.body;

    const result = await pool.query(
      `UPDATE planes
       SET nombre_plan = $1,
           descripcion = $2,
           precio = $3,
           duracion_meses = $4
       WHERE id_plan = $5`,
      [nombre_plan, descripcion, precio, duracion_meses, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json({ mensaje: "Plan actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar plan:", err);
    res.status(400).json({ mensaje: "Error al actualizar plan", error: err.message });
  }
};

// ✅ Eliminar plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM planes WHERE id_plan = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json({ mensaje: "Plan eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar plan:", err);
    res.status(500).json({ mensaje: "Error al eliminar plan" });
  }
};
