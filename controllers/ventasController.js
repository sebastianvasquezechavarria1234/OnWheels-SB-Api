import pool from "../db/postgresPool.js";
import Venta from "../models/Ventas.js";

// ✅ Obtener todas las ventas
export const getVentas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.nombre_completo AS usuario
      FROM ventas v
      INNER JOIN usuarios u ON v.id_usuario = u.id_usuario
      ORDER BY v.fecha_venta DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener ventas", error: err.message });
  }
};

// ✅ Obtener una venta por ID
export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT v.*, u.nombre_completo AS usuario
      FROM ventas v
      INNER JOIN usuarios u ON v.id_usuario = u.id_usuario
      WHERE v.id_venta = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener la venta", error: err.message });
  }
};

// ✅ Crear una nueva venta
export const createVenta = async (req, res) => {
  try {
    const { id_usuario, metodo_pago, estado_venta = "pendiente", fecha_venta } = req.body;

    const result = await pool.query(
      `
      INSERT INTO ventas (id_usuario, metodo_pago, estado_venta, fecha_venta)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [id_usuario, metodo_pago, estado_venta, fecha_venta]
    );

    const nuevaVenta = new Venta(result.rows[0]);
    res.status(201).json(nuevaVenta);
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: "Error al crear venta", error: err.message });
  }
};

// ✅ Actualizar venta
export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, metodo_pago, estado_venta, fecha_venta } = req.body;

    const result = await pool.query(
      `
      UPDATE ventas
      SET id_usuario = $1,
          metodo_pago = $2,
          estado_venta = $3,
          fecha_venta = $4
      WHERE id_venta = $5
      RETURNING *
      `,
      [id_usuario, metodo_pago, estado_venta, fecha_venta, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    res.json({ mensaje: "Venta actualizada correctamente", venta: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: "Error al actualizar venta", error: err.message });
  }
};

// ✅ Eliminar venta
export const deleteVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM ventas WHERE id_venta = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al eliminar venta", error: err.message });
  }
};
