import pool from "../db/postgresPool.js";

// Obtener todos los acudientes
export const getAcudientes = async (req, res) => {
  try {
    const query = `
      SELECT * FROM acudientes 
      WHERE nombre_acudiente IS NOT NULL 
      ORDER BY nombre_acudiente ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener acudientes:", err);
    res.status(500).json({ mensaje: "Error al obtener acudientes" });
  }
};

// Obtener acudiente por ID
export const getAcudienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM acudientes WHERE id_acudiente = $1";
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Acudiente no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener acudiente:", err);
    res.status(500).json({ mensaje: "Error al obtener acudiente" });
  }
};

// Crear acudiente
export const createAcudiente = async (req, res) => {
  try {
    const { nombre_acudiente, telefono, email, relacion } = req.body;
    
    // Validaciones básicas
    if (!nombre_acudiente) {
      return res.status(400).json({ mensaje: "El nombre del acudiente es obligatorio" });
    }

    const query = `
      INSERT INTO acudientes (nombre_acudiente, telefono, email, relacion)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const values = [nombre_acudiente, telefono, email, relacion];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creando acudiente:", err);
    // Manejo de conflicto de email único si existe
    if (err.code === "23505") {
      return res.status(409).json({ mensaje: "El email del acudiente ya existe" });
    }
    res.status(500).json({ mensaje: "Error creando acudiente" });
  }
};

// Actualizar acudiente
export const updateAcudiente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_acudiente, telefono, email, relacion } = req.body;
    
    if (!nombre_acudiente) {
      return res.status(400).json({ mensaje: "El nombre del acudiente es obligatorio" });
    }

    const query = `
      UPDATE acudientes
      SET nombre_acudiente = $1,
          telefono = $2,
          email = $3,
          relacion = $4
      WHERE id_acudiente = $5
      RETURNING *;
    `;
    
    const values = [nombre_acudiente, telefono, email, relacion, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Acudiente no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error actualizando acudiente:", err);
    if (err.code === "23505") {
      return res.status(409).json({ mensaje: "El email del acudiente ya existe" });
    }
    res.status(500).json({ mensaje: "Error actualizando acudiente" });
  }
};

// Eliminar acudiente
export const deleteAcudiente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el acudiente está asociado a estudiantes
    const checkEstudiantes = await pool.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_acudiente = $1 LIMIT 1",
      [id]
    );
    
    if (checkEstudiantes.rowCount > 0) {
      return res.status(400).json({ 
        mensaje: "No se puede eliminar el acudiente porque tiene estudiantes asociados" 
      });
    }

    const query = "DELETE FROM acudientes WHERE id_acudiente = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Acudiente no encontrado" });
    }
    
    res.json({ mensaje: "Acudiente eliminado correctamente" });
  } catch (err) {
    console.error("Error eliminando acudiente:", err);
    res.status(500).json({ mensaje: "Error eliminando acudiente" });
  }
};