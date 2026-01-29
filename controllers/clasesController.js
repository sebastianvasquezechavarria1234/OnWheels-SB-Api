// controllers/clasesController.js
import pool from "../db/postgresPool.js";

// Obtener todas las clases con instructores
export const getClases = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        n.nombre_nivel,
        s.nombre_sede,
        json_agg(
          json_build_object(
            'id_instructor', i.id_instructor,
            'nombre_instructor', u.nombre_completo,
            'rol_instructor', ci.rol_instructor
          )
        ) FILTER (WHERE i.id_instructor IS NOT NULL) AS instructores
      FROM clases c
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s ON c.id_sede = s.id_sede
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase
      LEFT JOIN instructores i ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
      GROUP BY c.id_clase, n.nombre_nivel, s.nombre_sede
      ORDER BY c.id_clase DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clases:", err);
    res.status(500).json({ mensaje: "Error al obtener clases" });
  }
};

// Obtener clase por ID
export const getClaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        c.*,
        n.nombre_nivel,
        s.nombre_sede,
        json_agg(
          json_build_object(
            'id_instructor', i.id_instructor,
            'nombre_instructor', u.nombre_completo,
            'rol_instructor', ci.rol_instructor
          )
        ) FILTER (WHERE i.id_instructor IS NOT NULL) AS instructores
      FROM clases c
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s ON c.id_sede = s.id_sede
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase
      LEFT JOIN instructores i ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE c.id_clase = $1
      GROUP BY c.id_clase, n.nombre_nivel, s.nombre_sede
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener clase:", err);
    res.status(500).json({ mensaje: "Error al obtener clase" });
  }
};

// Crear clase
export const createClase = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_nivel, id_sede, instructores, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin } = req.body;

    // Validaciones básicas
    if (!id_nivel || !id_sede) {
      return res.status(400).json({ mensaje: "Nivel y sede son obligatorios" });
    }

    await client.query('BEGIN');

    // Insertar la clase
    const claseResult = await client.query(
      `INSERT INTO clases (id_nivel, id_sede, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_clase`,
      [id_nivel, id_sede, cupo_maximo || null, dia_semana || null, descripcion || null, estado || 'Disponible', hora_inicio || null, hora_fin || null]
    );
    const id_clase = claseResult.rows[0].id_clase;

    // Insertar los instructores
    if (instructores && instructores.length > 0) {
      for (const inst of instructores) {
        if (!inst.id_instructor) continue;
        await client.query(
          `INSERT INTO clases_instructores (id_clase, id_instructor, rol_instructor)
           VALUES ($1, $2, $3)`,
          [id_clase, inst.id_instructor, inst.rol_instructor || 'Principal']
        );
      }
    }

    await client.query('COMMIT');

    // Devolver la clase completa
    const result = await pool.query(`
      SELECT 
        c.*,
        n.nombre_nivel,
        s.nombre_sede,
        json_agg(
          json_build_object(
            'id_instructor', i.id_instructor,
            'nombre_instructor', u.nombre_completo,
            'rol_instructor', ci.rol_instructor
          )
        ) FILTER (WHERE i.id_instructor IS NOT NULL) AS instructores
      FROM clases c
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s ON c.id_sede = s.id_sede
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase
      LEFT JOIN instructores i ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE c.id_clase = $1
      GROUP BY c.id_clase, n.nombre_nivel, s.nombre_sede
    `, [id_clase]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error al crear clase:", err);
    if (err.code === "23503") {
      res.status(400).json({ mensaje: "Uno de los IDs relacionados no es válido" });
    } else {
      res.status(400).json({ mensaje: "Error al crear la clase", error: err.message });
    }
  } finally {
    client.release();
  }
};

// Actualizar clase
export const updateClase = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { id_nivel, id_sede, instructores, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin } = req.body;

    await client.query('BEGIN');

    // Actualizar la clase
    await client.query(
      `UPDATE clases
       SET 
         id_nivel = $1,
         id_sede = $2,
         cupo_maximo = $3,
         dia_semana = $4,
         descripcion = $5,
         estado = $6,
         hora_inicio = $7,
         hora_fin = $8
       WHERE id_clase = $9`,
      [id_nivel, id_sede, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin, id]
    );

    // Eliminar instructores actuales
    await client.query("DELETE FROM clases_instructores WHERE id_clase = $1", [id]);

    // Insertar nuevos instructores
    if (instructores && instructores.length > 0) {
      for (const inst of instructores) {
        if (!inst.id_instructor) continue;
        await client.query(
          `INSERT INTO clases_instructores (id_clase, id_instructor, rol_instructor)
           VALUES ($1, $2, $3)`,
          [id, inst.id_instructor, inst.rol_instructor || 'Principal']
        );
      }
    }

    await client.query('COMMIT');

    // Devolver la clase actualizada
    const result = await pool.query(`
      SELECT 
        c.*,
        n.nombre_nivel,
        s.nombre_sede,
        json_agg(
          json_build_object(
            'id_instructor', i.id_instructor,
            'nombre_instructor', u.nombre_completo,
            'rol_instructor', ci.rol_instructor
          )
        ) FILTER (WHERE i.id_instructor IS NOT NULL) AS instructores
      FROM clases c
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s ON c.id_sede = s.id_sede
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase
      LEFT JOIN instructores i ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE c.id_clase = $1
      GROUP BY c.id_clase, n.nombre_nivel, s.nombre_sede
    `, [id]);

    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar clase:", err);
    res.status(400).json({ mensaje: "Error al actualizar la clase", error: err.message });
  } finally {
    client.release();
  }
};

// Eliminar clase
export const deleteClase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM clases WHERE id_clase = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    res.json({ mensaje: "Clase eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar clase:", err);
    res.status(500).json({ mensaje: "Error al eliminar la clase" });
  }
};

/**
 * Obtener clases asignadas al instructor autenticado.
 * - Valida que el ID solicitado coincida con el usuario token, o sea Admin.
 */
export const getClasesInstructor = async (req, res) => {
  try {
    const { id } = req.params; // ID de usuario (instructor)
    const userId = req.user.id_usuario;
    const userRole = req.user.roles || []; // array de strings o objetos?
    // AuthController retorna: roles: ['admin', 'instructor'] (strings) o objetos?
    // En authController login: const roles = rolesResult.rows.map(r => r.nombre_rol.toLowerCase()); -> Array de strings.

    // Validación de seguridad: Solo el propio instructor o un admin pueden ver esto
    const isAdmin = userRole.some(r => r === 'administrador' || r === 'admin');

    if (userId.toString() !== id.toString() && !isAdmin) {
      return res.status(403).json({ mensaje: "No tienes permiso para ver las clases de otro instructor" });
    }

    // Buscar el id_instructor correspondiente al id_usuario
    const instResult = await pool.query("SELECT id_instructor FROM instructores WHERE id_usuario = $1", [id]);
    if (instResult.rowCount === 0) {
      return res.json([]); // No es instructor registrado -> 0 clases
    }
    const id_instructor = instResult.rows[0].id_instructor;

    // Reutilizamos la query gigante pero filtrando por instructor
    // Nota: La query original hace LEFT JOIN instructores i ...
    // Podemos filtrar WHERE ci.id_instructor = $1
    const query = `
      SELECT
        c.*,
        n.nombre_nivel,
        s.nombre_sede,
        json_agg(
          json_build_object(
            'id_instructor', i.id_instructor,
            'nombre_instructor', u.nombre_completo,
            'rol_instructor', ci.rol_instructor
          )
        ) FILTER (WHERE i.id_instructor IS NOT NULL) AS instructores
      FROM clases c
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s ON c.id_sede = s.id_sede
      JOIN clases_instructores ci_filter ON c.id_clase = ci_filter.id_clase -- Join específico para el filtro
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase -- Join para el json_agg (todos los instructores de la clase)
      LEFT JOIN instructores i ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE ci_filter.id_instructor = $1
      GROUP BY c.id_clase, n.nombre_nivel, s.nombre_sede
      ORDER BY c.id_clase DESC
    `;

    const result = await pool.query(query, [id_instructor]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clases de instructor:", err);
    res.status(500).json({ mensaje: "Error al obtener clases" });
  }
};