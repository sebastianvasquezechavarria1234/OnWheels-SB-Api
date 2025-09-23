// controllers/planesClasesController.js


import { getPool } from "../db/mssqlPool.js";

// ✅ Obtener todos los planes
export const getPlanes = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM PLANES_CLASES");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener planes", error: error.message });
  }
};

// ✅ Obtener plan por ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_plan", id)
      .query("SELECT * FROM PLANES_CLASES WHERE id_plan = @id_plan");

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener plan", error: error.message });
  }
};

// ✅ Crear plan
export const createPlan = async (req, res) => {
  try {
    const { nombre_plan, descripcion, precio, descuento_porcentaje } = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("nombre_plan", nombre_plan)
      .input("descripcion", descripcion)
      .input("precio", precio)
      .input("descuento_porcentaje", descuento_porcentaje)
      .query(`
        INSERT INTO PLANES_CLASES (nombre_plan, descripcion, precio, descuento_porcentaje)
        OUTPUT INSERTED.*
        VALUES (@nombre_plan, @descripcion, @precio, @descuento_porcentaje)
      `);

    res.status(201).json({ mensaje: "Plan creado", plan: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear plan", error: error.message });
  }
};

// ✅ Actualizar plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_plan, descripcion, precio, descuento_porcentaje } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_plan", id)
      .input("nombre_plan", nombre_plan)
      .input("descripcion", descripcion)
      .input("precio", precio)
      .input("descuento_porcentaje", descuento_porcentaje)
      .query(`
        UPDATE PLANES_CLASES
        SET nombre_plan=@nombre_plan, descripcion=@descripcion, precio=@precio, descuento_porcentaje=@descuento_porcentaje
        WHERE id_plan=@id_plan
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json({ mensaje: "Plan actualizado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar plan", error: error.message });
  }
};

// ✅ Eliminar plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_plan", id)
      .query("DELETE FROM PLANES_CLASES WHERE id_plan=@id_plan");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    res.json({ mensaje: "Plan eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar plan", error: error.message });
  }
};
