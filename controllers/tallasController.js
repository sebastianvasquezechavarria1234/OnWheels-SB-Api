import { getPool } from "../db/postgresPool.js";
import Talla from "../models/TallaVariante.js";

// Listar
export const listarTallas = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM TALLAS");
    const tallas = result.recordset.map(row => new Talla(row));
    res.json(tallas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear
export const crearTalla = async (req, res) => {
  try {
    const { nombre_talla, descripcion } = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("nombre_talla", nombre_talla)
      .input("descripcion", descripcion)
      .query("INSERT INTO TALLAS (nombre_talla, descripcion) OUTPUT INSERTED.* VALUES (@nombre_talla, @descripcion)");
    const nueva = new Talla(result.recordset[0]);
    res.json(nueva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
export const actualizarTalla = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_talla, descripcion } = req.body;
    const pool = await getPool();
    await pool
      .request()
      .input("id_talla", id)
      .input("nombre_talla", nombre_talla)
      .input("descripcion", descripcion)
      .query("UPDATE TALLAS SET nombre_talla=@nombre_talla, descripcion=@descripcion WHERE id_talla=@id_talla");
    res.json({ message: "Talla actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
export const eliminarTalla = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input("id_talla", id).query("DELETE FROM TALLAS WHERE id_talla=@id_talla");
    res.json({ message: "Talla eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
