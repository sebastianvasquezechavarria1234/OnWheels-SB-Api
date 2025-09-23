// controllers/matriculasController.js
import { getPool } from "../db/mssqlPool.js";

// ✅ Obtener todas las matrículas
export const getMatriculas = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM MATRICULAS");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener matrículas", error: error.message });
  }
};

// ✅ Obtener matrícula por ID
export const getMatriculaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_matricula", id)
      .query("SELECT * FROM MATRICULAS WHERE id_matricula = @id_matricula");

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener matrícula", error: error.message });
  }
};

// ✅ Crear matrícula
export const createMatricula = async (req, res) => {
  try {
    const { id_preinscripcion, id_clase, id_plan, id_metodo_pago, fecha_matricula, valor_matricula } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_preinscripcion", id_preinscripcion)
      .input("id_clase", id_clase)
      .input("id_plan", id_plan)
      .input("id_metodo_pago", id_metodo_pago)
      .input("fecha_matricula", fecha_matricula)
      .input("valor_matricula", valor_matricula)
      .query(`
        INSERT INTO MATRICULAS (id_preinscripcion, id_clase, id_plan, id_metodo_pago, fecha_matricula, valor_matricula)
        OUTPUT INSERTED.*
        VALUES (@id_preinscripcion, @id_clase, @id_plan, @id_metodo_pago, @fecha_matricula, @valor_matricula)
      `);

    res.status(201).json({ mensaje: "Matrícula creada", matricula: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear matrícula", error: error.message });
  }
};

// ✅ Actualizar matrícula
export const updateMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_preinscripcion, id_clase, id_plan, id_metodo_pago, fecha_matricula, valor_matricula } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_matricula", id)
      .input("id_preinscripcion", id_preinscripcion)
      .input("id_clase", id_clase)
      .input("id_plan", id_plan)
      .input("id_metodo_pago", id_metodo_pago)
      .input("fecha_matricula", fecha_matricula)
      .input("valor_matricula", valor_matricula)
      .query(`
        UPDATE MATRICULAS
        SET id_preinscripcion=@id_preinscripcion, id_clase=@id_clase, id_plan=@id_plan,
            id_metodo_pago=@id_metodo_pago, fecha_matricula=@fecha_matricula, valor_matricula=@valor_matricula
        WHERE id_matricula=@id_matricula
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }

    res.json({ mensaje: "Matrícula actualizada" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar matrícula", error: error.message });
  }
};

// ✅ Eliminar matrícula
export const deleteMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id_matricula", id)
      .query("DELETE FROM MATRICULAS WHERE id_matricula=@id_matricula");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Matrícula no encontrada" });
    }

    res.json({ mensaje: "Matrícula eliminada" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar matrícula", error: error.message });
  }
};
