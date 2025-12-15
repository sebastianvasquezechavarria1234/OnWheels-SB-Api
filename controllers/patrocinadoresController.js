import pool from "../db/postgresPool.js";

// Obtener todos
export const getPatrocinadores = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM patrocinadores ORDER BY nombre_patrocinador ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ getPatrocinadores:", error);
    res.status(500).json({ mensaje: "Error al obtener patrocinadores" });
  }
};

// Obtener por ID
export const getPatrocinadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM patrocinadores WHERE id_patrocinador = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ getPatrocinadorById:", error);
    res.status(500).json({ mensaje: "Error al obtener patrocinador" });
  }
};

// Función auxiliar de validación
const validatePatrocinador = (body) => {
    const { nombre_patrocinador, email, telefono, logo } = body;
    let errors = [];

    if (!nombre_patrocinador || nombre_patrocinador.trim().length < 2) {
        errors.push("El nombre debe tener mínimo 2 caracteres");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
        errors.push("Formato de email inválido");
    }

    const phoneRegex = /^[0-9+\s()-]{7,20}$/;
    if (!telefono || !phoneRegex.test(telefono.trim())) {
        errors.push("Teléfono inválido (7-20 caracteres)");
    }

    if (logo && logo.trim() !== "") {
        try {
            new URL(logo.trim());
        } catch {
            errors.push("URL del logo inválida");
        }
    }

    return errors;
};

// Crear
export const createPatrocinador = async (req, res) => {
  try {
    const errors = validatePatrocinador(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ mensaje: "Error de validación", detalles: errors });
    }

    const { nombre_patrocinador, email, telefono, logo } = req.body;

    const result = await pool.query(
      `INSERT INTO patrocinadores (nombre_patrocinador, email, telefono, logo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre_patrocinador.trim(), email.trim(), telefono.trim(), logo?.trim() || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ createPatrocinador:", error);
    res.status(500).json({ mensaje: "Error al crear patrocinador", error: error.message });
  }
};

// Actualizar
export const updatePatrocinador = async (req, res) => {
  try {
    const errors = validatePatrocinador(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ mensaje: "Error de validación", detalles: errors });
    }

    const { id } = req.params;
    const { nombre_patrocinador, email, telefono, logo } = req.body;

    const result = await pool.query(
      `UPDATE patrocinadores
       SET nombre_patrocinador = $1,
           email = $2,
           telefono = $3,
           logo = $4
       WHERE id_patrocinador = $5
       RETURNING *`,
      [nombre_patrocinador, email, telefono, logo, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ updatePatrocinador:", error);
    res.status(400).json({ mensaje: "Error al actualizar patrocinador" });
  }
};

// Eliminar
export const deletePatrocinador = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM patrocinadores WHERE id_patrocinador = $1",
      [id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ mensaje: "Patrocinador no encontrado" });

    res.json({ mensaje: "Patrocinador eliminado correctamente" });
  } catch (error) {
    console.error("❌ deletePatrocinador:", error);
    res.status(500).json({ mensaje: "Error al eliminar patrocinador" });
  }
};
