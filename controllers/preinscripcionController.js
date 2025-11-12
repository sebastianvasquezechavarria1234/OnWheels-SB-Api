// controllers/preinscripcionesController.js
import { getPool } from "../db/postgresPool.js";

// ✅ Obtener todas las preinscripciones
 export const getPreinscripciones = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        p.id_preinscripcion,
        p.nivel_experiencia,
        p.edad,
        p.otra_enfermedad,
        u.id_usuario,
        u.nombre_completo AS nombre_usuario,
        u.email AS email_usuario,
        u.telefono AS telefono_usuario,
        u.direccion AS direccion_usuario,
        u.fecha_nacimiento,
        u.tipo_documento,
        u.documento,
        u.tipo_genero,
        a.id_acudiente,
        a.nombre_completo AS nombre_acudiente,
        a.telefono_principal,
        a.telefono_secundario,
        a.email AS email_acudiente,
        a.direccion AS direccion_acudiente,
        a.parentesco
      FROM PREINSCRIPCIONES p
      INNER JOIN USUARIOS u ON p.id_usuario = u.id_usuario
      LEFT JOIN ACUDIENTES a ON p.id_acudiente = a.id_acudiente
      ORDER BY p.id_preinscripcion DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener preinscripciones" });
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
