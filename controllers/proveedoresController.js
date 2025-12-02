import pool from "../db/postgresPool.js";
import Proveedor from "../models/Proveedores.js";

// ✅ Obtener todos los proveedores
export const getProveedores = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM proveedores ORDER BY nombre_proveedor ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener proveedores:", err);
    res.status(500).json({ mensaje: "Error al obtener proveedores" });
  }
};

// ✅ Obtener proveedor por NIT
export const getProveedorById = async (req, res) => {
  try {
    const { nit } = req.params;
    const result = await pool.query("SELECT * FROM proveedores WHERE nit = $1", [nit]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Proveedor no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener proveedor:", err);
    res.status(500).json({ mensaje: "Error al obtener proveedor" });
  }
};

// ✅ Crear proveedor
export const createProveedor = async (req, res) => {
  try {
    const { nit, nombre_proveedor, email, telefono, direccion } = req.body;

    await pool.query(
      `INSERT INTO proveedores (nit, nombre_proveedor, email, telefono, direccion)
       VALUES ($1, $2, $3, $4, $5)`,
      [nit, nombre_proveedor, email, telefono, direccion]
    );

    const nuevoProveedor = new Proveedor({
      nit,
      nombre_proveedor,
      email,
      telefono,
      direccion
    });

    res.status(201).json({ mensaje: "Proveedor creado correctamente", proveedor: nuevoProveedor });
  } catch (err) {
    console.error("❌ Error al crear proveedor:", err);
    res.status(400).json({ mensaje: "Error al crear proveedor", error: err.message });
  }
};

// ✅ Actualizar proveedor
export const updateProveedor = async (req, res) => {
  try {
    const { nit } = req.params;
    const { nombre_proveedor, email, telefono, direccion } = req.body;

    const result = await pool.query(
      `UPDATE proveedores
       SET nombre_proveedor = $1,
           email = $2,
           telefono = $3,
           direccion = $4
       WHERE nit = $5`,
      [nombre_proveedor, email, telefono, direccion, nit]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Proveedor no encontrado" });
    }

    res.json({ mensaje: "Proveedor actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar proveedor:", err);
    res.status(400).json({ mensaje: "Error al actualizar proveedor", error: err.message });
  }
};

// ✅ Eliminar proveedor
export const deleteProveedor = async (req, res) => {
  try {
    const { nit } = req.params;

    const result = await pool.query("DELETE FROM proveedores WHERE nit = $1", [nit]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Proveedor no encontrado" });
    }

    res.json({ mensaje: "Proveedor eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar proveedor:", err);
    res.status(500).json({ mensaje: "Error al eliminar proveedor" });
  }
};
