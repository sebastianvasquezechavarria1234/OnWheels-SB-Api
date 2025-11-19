import pool from "../db/postgresPool.js";

// Listar todas las preinscripciones pendientes
export const listarPreinscripciones = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM estudiantes WHERE estado = 'pendiente'"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las preinscripciones", error });
  }
};

// Aceptar preinscripción (cambiar a activo)
export const aceptarPreinscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE estudiantes SET estado = 'activo' WHERE id_estudiante = $1",
      [id]
    );
    res.json({ message: "✅ Preinscripción aceptada y estudiante activado" });
  } catch (error) {
    res.status(500).json({ message: "Error al aceptar la preinscripción", error });
  }
};

// Rechazar preinscripción (eliminar registro o marcar rechazado)
export const rechazarPreinscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    // Opción 1: marcar como rechazado
    await pool.query(
      "UPDATE estudiantes SET estado = 'rechazado' WHERE id_estudiante = $1",
      [id]
    );

    // O si prefieres eliminarlo completamente, usa:
    // await pool.query("DELETE FROM estudiantes WHERE id_estudiante = $1", [id]);

    res.json({ message: "❌ Preinscripción rechazada" });
  } catch (error) {
    res.status(500).json({ message: "Error al rechazar la preinscripción", error });
  }
};
