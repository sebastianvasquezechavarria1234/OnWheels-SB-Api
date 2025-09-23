// controllers/preinscripcionesController.js
import { getPool } from "../db/mssqlPool.js";

// ✅ Obtener todas las preinscripciones
export const getPreinscripciones = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM PREINSCRIPCIONES");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener preinscripciones", error: error.message });
  }
};

// ✅ Obtener preinscripción por ID
export const getPreinscripcionById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_preinscripcion", id)
      .query("SELECT * FROM PREINSCRIPCIONES WHERE id_preinscripcion = @id_preinscripcion");

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener preinscripción", error: error.message });
  }
};

// ✅ Crear preinscripción
export const createPreinscripcion = async (req, res) => {
  try {
    const { id_usuario, id_acudiente, nivel_experiencia, edad, otra_enfermedad } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_usuario", id_usuario)
      .input("id_acudiente", id_acudiente || null)
      .input("nivel_experiencia", nivel_experiencia)
      .input("edad", edad)
      .input("otra_enfermedad", otra_enfermedad)
      .query(`
        INSERT INTO PREINSCRIPCIONES (id_usuario, id_acudiente, nivel_experiencia, edad, otra_enfermedad)
        OUTPUT INSERTED.*
        VALUES (@id_usuario, @id_acudiente, @nivel_experiencia, @edad, @otra_enfermedad)
      `);

    res.status(201).json({ mensaje: "Preinscripción creada", preinscripcion: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear preinscripción", error: error.message });
  }
};

// ✅ Actualizar preinscripción
export const updatePreinscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, id_acudiente, nivel_experiencia, edad, otra_enfermedad } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_preinscripcion", id)
      .input("id_usuario", id_usuario)
      .input("id_acudiente", id_acudiente || null)
      .input("nivel_experiencia", nivel_experiencia)
      .input("edad", edad)
      .input("otra_enfermedad", otra_enfermedad)
      .query(`
        UPDATE PREINSCRIPCIONES
        SET id_usuario=@id_usuario, id_acudiente=@id_acudiente, nivel_experiencia=@nivel_experiencia,
            edad=@edad, otra_enfermedad=@otra_enfermedad
        WHERE id_preinscripcion=@id_preinscripcion
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }

    res.json({ mensaje: "Preinscripción actualizada" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar preinscripción", error: error.message });
  }
};

// ✅ Eliminar preinscripción
export const deletePreinscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_preinscripcion", id)
      .query("DELETE FROM PREINSCRIPCIONES WHERE id_preinscripcion=@id_preinscripcion");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }

    res.json({ mensaje: "Preinscripción eliminada" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar preinscripción", error: error.message });
  }
};
