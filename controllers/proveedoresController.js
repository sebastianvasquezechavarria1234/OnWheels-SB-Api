
import sql from "mssql";
import Proveedor from "../models/Proveedores.js";

// ✅ Obtener todos los proveedores
export const getProveedores = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query("SELECT * FROM PROVEEDORES")
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener proveedores" })
  }
}

// ✅ Obtener proveedor por NIT
export const getProveedorById = async (req, res) => {
  try {
    const { nit } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("nit", sql.VarChar, nit) 
      .query("SELECT * FROM PROVEEDORES WHERE NIT_proveedor = @nit")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Proveedor no encontrado" })
    }

    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener el proveedor" })
  }
}

// ✅ Crear proveedor
export const createProveedor = async (req, res) => {
  try {
    const { NIT_proveedor, nombre_proveedor, email, telefono, direccion } = req.body

    const pool = await sql.connect()
    await pool.request()
      .input("NIT_proveedor", sql.VarChar, NIT_proveedor)
      .input("nombre_proveedor", sql.VarChar, nombre_proveedor)
      .input("email", sql.VarChar, email)
      .input("telefono", sql.VarChar, telefono)
      .input("direccion", sql.VarChar, direccion)
      .query(`
        INSERT INTO PROVEEDORES (NIT_proveedor, nombre_proveedor, email, telefono, direccion)
        VALUES (@NIT_proveedor, @nombre_proveedor, @email, @telefono, @direccion)
      `)

    res.status(201).json({ mensaje: "Proveedor creado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear proveedor", error: err.message })
  }
}

// ✅ Actualizar proveedor
export const updateProveedor = async (req, res) => {
  try {
    const { nit } = req.params
    const { nombre_proveedor, email, telefono, direccion } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("nit", sql.VarChar, nit)
      .input("nombre_proveedor", sql.VarChar, nombre_proveedor)
      .input("email", sql.VarChar, email)
      .input("telefono", sql.VarChar, telefono)
      .input("direccion", sql.VarChar, direccion)
      .query(`
        UPDATE PROVEEDORES
        SET nombre_proveedor = @nombre_proveedor,
            email = @email,
            telefono = @telefono,
            direccion = @direccion
        WHERE NIT_proveedor = @nit
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Proveedor no encontrado" })
    }

    res.json({ mensaje: "Proveedor actualizado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar proveedor", error: err.message })
  }
}

// ✅ Eliminar proveedor
export const deleteProveedor = async (req, res) => {
  try {
    const { nit } = req.params
    const pool = await sql.connect()
    const result = await pool.request()
      .input("nit", sql.VarChar, nit)
      .query("DELETE FROM PROVEEDORES WHERE NIT_proveedor = @nit")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Proveedor no encontrado" })
    }

    res.json({ mensaje: "Proveedor eliminado correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar proveedor" })
  }
}
