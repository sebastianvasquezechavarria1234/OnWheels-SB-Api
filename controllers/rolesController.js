// controllers/rolesController.js
<<<<<<< HEAD
import pool from "../db/postgresPool.js";
import Rol from "../models/Roles.js"; // Asegúrate de que este modelo esté adaptado para recibir datos de PostgreSQL
=======
import pool from "../db/postgresPool.js"
import Rol from "../models/Roles.js"
>>>>>>> b9b1f16da32a942b02766311c2530a1f10b6113b

// ✅ Obtener todos los roles
export const getRoles = async (req, res) => {
  try {
<<<<<<< HEAD
    // Usamos pool.query directamente, no necesitamos await sql.connect()
    const result = await pool.query("SELECT * FROM ROLES ORDER BY nombre_rol ASC");
    res.json(result.rows); // En pg, los resultados están en .rows, no .recordset
=======
    const result = await pool.query("SELECT * FROM roles ORDER BY nombre_rol ASC")
    res.json(result.rows)
>>>>>>> b9b1f16da32a942b02766311c2530a1f10b6113b
  } catch (err) {
    console.error("Error en getRoles:", err);
    res.status(500).json({ mensaje: "Error al obtener roles" });
  }
};

// ✅ Obtener rol por ID
export const getRolById = async (req, res) => {
  try {
<<<<<<< HEAD
    const { id } = req.params;
    // Usamos placeholders ($1) en lugar de @id para pg
    const result = await pool.query(
      "SELECT * FROM ROLES WHERE id_rol = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" });
    }

    res.json(result.rows[0]); // .rows[0] en pg
=======
    const { id } = req.params
    const result = await pool.query("SELECT * FROM roles WHERE id_rol = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Rol no encontrado" })
    }

    res.json(result.rows[0])
>>>>>>> b9b1f16da32a942b02766311c2530a1f10b6113b
  } catch (err) {
    console.error("Error en getRolById:", err);
    res.status(500).json({ mensaje: "Error al obtener rol" });
  }
};

// ✅ Crear rol
export const createRol = async (req, res) => {
  try {
    const { nombre_rol, descripcion, estado } = req.body;

<<<<<<< HEAD
    // Usamos placeholders ($1, $2, $3) y pasamos los valores en un array
    const result = await pool.query(
      `INSERT INTO ROLES (nombre_rol, descripcion, estado)
       VALUES ($1, $2, $3) RETURNING *`, // RETURNING * devuelve el registro insertado
      [nombre_rol, descripcion, estado]
    );

    // Creamos una nueva instancia del modelo con los datos devueltos por PostgreSQL
    const nuevoRol = new Rol(result.rows[0]); // Ajusta según cómo funcione tu modelo Rol
=======
    const result = await pool.query(
      `INSERT INTO roles (nombre_rol, descripcion, estado)
       VALUES ($1, $2, $3)
       RETURNING id_rol`,
      [nombre_rol, descripcion, estado]
    )

    const nuevoRol = new Rol({
      id_rol: result.rows[0].id_rol,
      nombre_rol,
      descripcion,
      estado
    })
>>>>>>> b9b1f16da32a942b02766311c2530a1f10b6113b

    res.status(201).json(nuevoRol);
  } catch (err) {
    console.error("Error en createRol:", err);
    // Podría ser un error de base de datos (clave duplicada, campo nulo, etc.)
    res.status(400).json({ mensaje: "Error al crear rol", error: err.message });
  }
};

// ✅ Actualizar rol
export const updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_rol, descripcion, estado } = req.body;

    const result = await pool.query(
       HEAD
      `UPDATE ROLES
       SET nombre_rol = $1,
           descripcion = $2,
           estado = $3
       WHERE id_rol = $4`, 
      [nombre_rol, descripcion, estado, id]
    );

    if (result.rowCount === 0) { 
      return res.status(404).json({ mensaje: "Rol no encontrado" });

    }

    res.json({ mensaje: "Rol actualizado correctamente" });
  } catch (err) {
    console.error("Error en updateRol:", err);
    res.status(400).json({ mensaje: "Error al actualizar rol", error: err.message });
  }
};

// ✅ Eliminar rol
export const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM ROLES WHERE id_rol = $1",
      [id]
    );

    if (result.rowCount === 0) { // Igual, usamos .rowCount
      return res.status(404).json({ mensaje: "Rol no encontrado" });

    }

    res.json({ mensaje: "Rol eliminado correctamente" });
  } catch (err) {
    console.error("Error en deleteRol:", err);
    res.status(500).json({ mensaje: "Error al eliminar rol" });
  }
};