import { getPool } from "../db/mssqlPool.js";

// ✅ Obtener todos los niveles
export const getNiveles = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM NIVELES_CLASES");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener niveles", error: error.message });
  }
};

// ✅ Obtener un nivel por ID
export const getNivelById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_nivel", id)
      .query("SELECT * FROM NIVELES_CLASES WHERE id_nivel = @id_nivel");

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener nivel", error: error.message });
  }
};

// ✅ Crear un nivel
export const createNivel = async (req, res) => {
  try {
    const { nombre_nivel, descripcion } = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("nombre_nivel", nombre_nivel)
      .input("descripcion", descripcion)
      .query(
        "INSERT INTO NIVELES_CLASES (nombre_nivel, descripcion) OUTPUT INSERTED.* VALUES (@nombre_nivel, @descripcion)"
      );

    res.status(201).json({ mensaje: "Nivel creado", nivel: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear nivel", error: error.message });
  }
};

// ✅ Actualizar un nivel
export const updateNivel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_nivel, descripcion } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_nivel", id)
      .input("nombre_nivel", nombre_nivel)
      .input("descripcion", descripcion)
      .query(
        "UPDATE NIVELES_CLASES SET nombre_nivel=@nombre_nivel, descripcion=@descripcion WHERE id_nivel=@id_nivel"
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }

    res.json({ mensaje: "Nivel actualizado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar nivel", error: error.message });
  }
};

// ✅ Eliminar un nivel
export const deleteNivel = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_nivel", id)
      .query("DELETE FROM NIVELES_CLASES WHERE id_nivel=@id_nivel");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Nivel no encontrado" });
    }

    res.json({ mensaje: "Nivel eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar nivel", error: error.message });
  }
};
