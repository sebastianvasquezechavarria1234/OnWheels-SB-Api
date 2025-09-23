import sql from "mssql"

// Obtener todas las clases
export const getClases = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request().query(`
      SELECT * FROM CLASES
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener clases" })
  }
}

// Obtener una clase por ID
export const getClaseById = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM CLASES WHERE id_clase = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" })
    }
    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al obtener la clase" })
  }
}

// Crear clase
export const createClase = async (req, res) => {
  try {
    const { id_nivel, id_sede, id_usuario, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id_nivel", sql.Int, id_nivel)
      .input("id_sede", sql.Int, id_sede)
      .input("id_usuario", sql.Int, id_usuario)
      .input("cupo_maximo", sql.Int, cupo_maximo)
      .input("dia_semana", sql.NVarChar, dia_semana)
      .input("descripcion", sql.NVarChar, descripcion)
      .input("estado", sql.NVarChar, estado)
      .input("hora_inicio", sql.Time, hora_inicio)
      .input("hora_fin", sql.Time, hora_fin)
      .query(`
        INSERT INTO CLASES (id_nivel, id_sede, id_usuario, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin)
        VALUES (@id_nivel, @id_sede, @id_usuario, @cupo_maximo, @dia_semana, @descripcion, @estado, @hora_inicio, @hora_fin);
        SELECT SCOPE_IDENTITY() AS id_clase;
      `)

    res.status(201).json({ id_clase: result.recordset[0].id_clase, ...req.body })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al crear la clase", error: err.message })
  }
}

// Actualizar clase
export const updateClase = async (req, res) => {
  try {
    const { id } = req.params
    const { id_nivel, id_sede, id_usuario, cupo_maximo, dia_semana, descripcion, estado, hora_inicio, hora_fin } = req.body

    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("id_nivel", sql.Int, id_nivel)
      .input("id_sede", sql.Int, id_sede)
      .input("id_usuario", sql.Int, id_usuario)
      .input("cupo_maximo", sql.Int, cupo_maximo)
      .input("dia_semana", sql.NVarChar, dia_semana)
      .input("descripcion", sql.NVarChar, descripcion)
      .input("estado", sql.NVarChar, estado)
      .input("hora_inicio", sql.Time, hora_inicio)
      .input("hora_fin", sql.Time, hora_fin)
      .query(`
        UPDATE CLASES
        SET id_nivel = @id_nivel,
            id_sede = @id_sede,
            id_usuario = @id_usuario,
            cupo_maximo = @cupo_maximo,
            dia_semana = @dia_semana,
            descripcion = @descripcion,
            estado = @estado,
            hora_inicio = @hora_inicio,
            hora_fin = @hora_fin
        WHERE id_clase = @id
      `)

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" })
    }

    res.json({ mensaje: "Clase actualizada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(400).json({ mensaje: "Error al actualizar la clase", error: err.message })
  }
}

// Eliminar clase
export const deleteClase = async (req, res) => {
  try {
    const pool = await sql.connect()
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM CLASES WHERE id_clase = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Clase no encontrada" })
    }

    res.json({ mensaje: "Clase eliminada correctamente" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: "Error al eliminar la clase" })
  }
}
