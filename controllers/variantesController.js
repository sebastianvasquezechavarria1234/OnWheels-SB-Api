import { getPool } from "../db/postgresPool.js";
import Variante from "../models/Variantes.js";

// Listar variantes
export const listarVariantes = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT v.id_variante, v.id_producto, v.id_talla, v.id_color, v.stock,
             t.nombre_talla, c.nombre_color, c.codigo_hex
      FROM VARIANTES_PRODUCTO v
      INNER JOIN TALLAS t ON v.id_talla = t.id_talla
      INNER JOIN COLOR c ON v.id_color = c.id_color
    `);
    const variantes = result.recordset.map(row => new Variante(row));
    res.json(variantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const crearVariante = async (req, res) => {
  try {
    const { id_producto, id_talla, id_color, stock } = req.body;

    // Validación de campos obligatorios
    if (!id_producto || !id_talla || !id_color) {
      return res.status(400).json({ error: "Faltan campos obligatorios: id_producto, id_talla, id_color" });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_producto", id_producto)
      .input("id_talla", id_talla)
      .input("id_color", id_color)
      .input("stock", stock ?? 0) // si no mandas stock, lo pone en 0
      .query(`
        INSERT INTO VARIANTES_PRODUCTO (id_producto, id_talla, id_color, stock) 
        OUTPUT INSERTED.* 
        VALUES (@id_producto, @id_talla, @id_color, @stock)
      `);

    const nueva = new Variante(result.recordset[0]);
    res.json(nueva);

  } catch (error) {
    console.error("❌ Error creando variante:", error);
    res.status(500).json({ error: "Error creando variante", detalle: error.message });
  }
};

// Actualizar variante
export const actualizarVariante = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_producto, id_talla, id_color, stock } = req.body;
    const pool = await getPool();
    await pool
      .request()
      .input("id_variante", id)
      .input("id_producto", id_producto)
      .input("id_talla", id_talla)
      .input("id_color", id_color)
      .input("stock", stock)
      .query(`
        UPDATE VARIANTES_PRODUCTO
        SET id_producto=@id_producto, id_talla=@id_talla, id_color=@id_color, stock=@stock
        WHERE id_variante=@id_variante
      `);
    res.json({ message: "Variante actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar variante
export const eliminarVariante = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.request().input("id_variante", id).query("DELETE FROM VARIANTES_PRODUCTO WHERE id_variante=@id_variante");
    res.json({ message: "Variante eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
