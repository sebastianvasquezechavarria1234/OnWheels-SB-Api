// controllers/nivelesController.js
import pool from "../db/postgresPool.js";

// Obtener todos los niveles
export const obtenerNiveles = async (req, res) => {
  // Nodo 1
  try { // Nodo 2
    const result = await pool.query("SELECT * FROM niveles_clases"); // Nodo 3
    res.json(result.rows); // Nodo 4
  } catch (error) { // Nodo 5
    console.error("Error al obtener los niveles:", error); // Nodo 6
    res.status(500).json({ error: "Error al obtener los niveles" }); // Nodo 7
  }
}; // Fin

// Obtener un nivel por ID
export const obtenerNivelPorId = async (req, res) => {
  // Nodo 1
  const { id } = req.params; // Nodo 2
  try { // Nodo 3
    const result = await pool.query("SELECT * FROM niveles_clases WHERE id_nivel = $1", [id]); // Nodo 4
    if (result.rows.length === 0) { // Nodo 5
      return res.status(404).json({ mensaje: "Nivel no encontrado" }); // Nodo 6
    }
    res.json(result.rows[0]); // Nodo 7
  } catch (error) { // Nodo 8
    console.error("Error al obtener el nivel:", error); // Nodo 9
    res.status(500).json({ error: "Error al obtener el nivel" }); // Nodo 10
  }
}; // Fin

// Crear un nuevo nivel
export const crearNivel = async (req, res) => {
  // Nodo 1
  const { nombre_nivel, descripcion } = req.body; // Nodo 2
  try { // Nodo 3
    const result = await pool.query(
      "INSERT INTO niveles_clases (nombre_nivel, descripcion) VALUES ($1, $2) RETURNING *",
      [nombre_nivel, descripcion]
    ); // Nodo 4
    res.status(201).json(result.rows[0]); // Nodo 5
  } catch (error) { // Nodo 6
    console.error("Error al crear el nivel:", error); // Nodo 7
    res.status(500).json({ error: "Error al crear el nivel" }); // Nodo 8
  }
}; // Fin

// Actualizar un nivel
export const actualizarNivel = async (req, res) => {
  // Nodo 1
  const { id } = req.params; // Nodo 2
  const { nombre_nivel, descripcion } = req.body; // Nodo 3
  try { // Nodo 4
    const result = await pool.query(
      "UPDATE niveles_clases SET nombre_nivel = $1, descripcion = $2 WHERE id_nivel = $3 RETURNING *",
      [nombre_nivel, descripcion, id]
    ); // Nodo 5
    if (result.rows.length === 0) { // Nodo 6
      return res.status(404).json({ mensaje: "Nivel no encontrado" }); // Nodo 7
    }
    res.json(result.rows[0]); // Nodo 8
  } catch (error) { // Nodo 9
    console.error("Error al actualizar el nivel:", error); // Nodo 10
    res.status(500).json({ error: "Error al actualizar el nivel" }); // Nodo 11
  }
}; // Fin

// Eliminar un nivel
export const eliminarNivel = async (req, res) => {
  // Nodo 1
  const { id } = req.params; // Nodo 2
  try { // Nodo 3
    const result = await pool.query("DELETE FROM niveles_clases WHERE id_nivel = $1 RETURNING *", [id]); // Nodo 4
    if (result.rows.length === 0) { // Nodo 5
      return res.status(404).json({ mensaje: "Nivel no encontrado" }); // Nodo 6
    }
    res.json({ mensaje: "Nivel eliminado correctamente" }); // Nodo 7
  } catch (error) { // Nodo 8
    console.error("Error al eliminar el nivel:", error); // Nodo 9
    res.status(500).json({ error: "Error al eliminar el nivel" }); // Nodo 10
  }
}; // Fin