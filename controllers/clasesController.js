// controllers/clasesController.js
import pool from "../db/postgresPool.js";
import cloudinary from "../config/cloudinary.js";

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
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id_instructor', ins.id_instructor,
              'nombre_instructor', u_ins.nombre_completo,
              'rol_instructor', ci_sub.rol_instructor
            )
          ), '[]'::json)
          FROM clases_instructores ci_sub
          JOIN instructores ins ON ci_sub.id_instructor = ins.id_instructor
          JOIN usuarios u_ins ON ins.id_usuario = u_ins.id_usuario
          WHERE ci_sub.id_clase = c.id_clase
        ) AS instructores,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id_estudiante', est.id_estudiante,
              'nombre_estudiante', u_est.nombre_completo,
              'telefono', u_est.telefono
            )
          ), '[]'::json)
          FROM matriculas mat
          JOIN estudiantes est ON mat.id_estudiante = est.id_estudiante
          JOIN usuarios u_est ON est.id_usuario = u_est.id_usuario
          WHERE mat.id_clase = c.id_clase AND mat.estado = 'Activa'
        ) AS estudiantes
      FROM clases c
      LEFT JOIN niveles_clases n ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s ON c.id_sede = s.id_sede
      WHERE c.id_clase = $1
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
    const { id_nivel, id_sede, instructores, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin, url_imagen } = req.body;

    if (!id_nivel || !id_sede) {
      return res.status(400).json({ mensaje: "Nivel y sede son obligatorios" });
    }

    await client.query('BEGIN');

    const claseResult = await client.query(
      `INSERT INTO clases (id_nivel, id_sede, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin, url_imagen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_clase`,
      [id_nivel, id_sede, cupo_maximo || null, dia_semana || null, descripcion || null, estado || 'Disponible', hora_inicio || null, hora_fin || null, url_imagen || null]
    );
    const id_clase = claseResult.rows[0].id_clase;

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
    const { id_nivel, id_sede, instructores, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin, url_imagen } = req.body;

    await client.query('BEGIN');

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
         hora_fin = $8,
         url_imagen = $9
       WHERE id_clase = $10`,
      [id_nivel, id_sede, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin, url_imagen, id]
    );

    await client.query("DELETE FROM clases_instructores WHERE id_clase = $1", [id]);

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

// Clases del instructor autenticado
export const getClasesInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_usuario;
    const userRole = req.user.roles || [];

    const isAdmin = userRole.some(r => r === 'administrador' || r === 'admin');

    if (userId.toString() !== id.toString() && !isAdmin) {
      return res.status(403).json({ mensaje: "No tienes permiso para ver las clases de otro instructor" });
    }

    const instResult = await pool.query(
      "SELECT id_instructor FROM instructores WHERE id_usuario = $1",
      [id]
    );
    if (instResult.rowCount === 0) return res.json([]);

    const id_instructor = instResult.rows[0].id_instructor;

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
      JOIN clases_instructores ci_filter ON c.id_clase = ci_filter.id_clase
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase
      LEFT JOIN instructores i ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u ON i.id_usuario = u.id_usuario
      WHERE ci_filter.id_instructor = $1
      GROUP BY c.id_clase, n.nombre_nivel, s.nombre_sede
      ORDER BY c.id_clase DESC
    `, [id_instructor]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clases de instructor:", err);
    res.status(500).json({ mensaje: "Error al obtener clases" });
  }
};

// ✅ NUEVA: Clases del estudiante autenticado
export const getClasesEstudiante = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const estResult = await pool.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $1",
      [id_usuario]
    );
    if (estResult.rowCount === 0) return res.json([]);

    const id_estudiante = estResult.rows[0].id_estudiante;

    const result = await pool.query(`
      SELECT
        c.id_clase,
        c.dia_semana,
        c.hora_inicio,
        c.hora_fin,
        c.cupo_maximo,
        c.descripcion,
        c.estado,
        n.nombre_nivel,
        s.nombre_sede,
        s.direccion AS direccion_sede,
        m.estado      AS estado_matricula,
        m.fecha_matricula,
        m.clases_restantes,
        json_agg(
          json_build_object(
            'nombre_instructor', u.nombre_completo
          )
        ) FILTER (WHERE i.id_instructor IS NOT NULL) AS instructores
      FROM matriculas m
      JOIN clases c               ON m.id_clase = c.id_clase
      LEFT JOIN niveles_clases n  ON c.id_nivel = n.id_nivel
      LEFT JOIN sedes s           ON c.id_sede = s.id_sede
      LEFT JOIN clases_instructores ci ON c.id_clase = ci.id_clase
      LEFT JOIN instructores i    ON ci.id_instructor = i.id_instructor
      LEFT JOIN usuarios u        ON i.id_usuario = u.id_usuario
      WHERE m.id_estudiante = $1
      GROUP BY
        c.id_clase, n.nombre_nivel, s.nombre_sede,
        s.direccion, m.estado, m.fecha_matricula, m.clases_restantes
      ORDER BY m.fecha_matricula DESC
    `, [id_estudiante]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clases del estudiante:", err);
    res.status(500).json({ mensaje: "Error al obtener tus clases" });
  }
};

// ✅ Subir imagen de clase a Cloudinary
export const uploadClaseImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se ha subido ninguna imagen" });
    }

    // Convertir el buffer en un stream para Cloudinary
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "onwheels_clases",
            public_id: `clase_${Date.now()}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();
    res.json({
      mensaje: "Imagen subida correctamente",
      url_imagen: cloudinaryResult.secure_url
    });
  } catch (error) {
    console.error("Error en uploadClaseImage:", error);
    res.status(500).json({ mensaje: "Error al subir la imagen", error: error.message });
  }
};
