// controllers/clientesController.js
import pool from "../db/postgresPool.js";

// Obtener todos los clientes con info de usuario
export const getClientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_cliente,
        c.id_usuario,
        c.direccion_envio,
        c.telefono_contacto,
        c.metodo_pago,
        u.nombre_completo,
        u.email,
        u.telefono AS telefono_usuario,
        u.documento
      FROM clientes c
      JOIN usuarios u ON c.id_usuario = u.id_usuario
      ORDER BY u.nombre_completo;
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    return res.status(500).json({ mensaje: "Error al obtener clientes" });
  }
};

// Obtener cliente por id_cliente
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        c.id_cliente,
        c.id_usuario,
        c.direccion_envio,
        c.telefono_contacto,
        c.metodo_pago,
        u.nombre_completo,
        u.email,
        u.telefono AS telefono_usuario,
        u.documento
      FROM clientes c
      JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE c.id_cliente = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener cliente:", err);
    return res.status(500).json({ mensaje: "Error al obtener cliente" });
  }
};

// Crear cliente → requiere id_usuario existente
export const createCliente = async (req, res) => {
  const { id_usuario, direccion_envio, telefono_contacto, metodo_pago } = req.body;

  if (!id_usuario) {
    return res.status(400).json({ mensaje: "id_usuario es obligatorio" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar que el usuario exista
    const userCheck = await client.query("SELECT id_usuario FROM usuarios WHERE id_usuario = $1", [id_usuario]);
    if (userCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ mensaje: "Usuario no existe" });
    }

    // Verificar que no sea ya cliente
    const clienteExists = await client.query("SELECT id_cliente FROM clientes WHERE id_usuario = $1", [id_usuario]);
    if (clienteExists.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ mensaje: "Este usuario ya es cliente" });
    }

    const query = `
      INSERT INTO clientes (id_usuario, direccion_envio, telefono_contacto, metodo_pago)
      VALUES ($1, $2, $3, $4)
      RETURNING id_cliente;
    `;
    const result = await client.query(query, [id_usuario, direccion_envio, telefono_contacto, metodo_pago]);

    await client.query("COMMIT");
    return res.status(201).json({
      mensaje: "Cliente creado correctamente",
      id_cliente: result.rows[0].id_cliente,
      id_usuario
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al crear cliente:", err);
    if (err.code === "23505") {
      return res.status(409).json({ mensaje: "Este usuario ya tiene un perfil de cliente" });
    }
    return res.status(500).json({ mensaje: "Error al crear cliente" });
  } finally {
    client.release();
  }
};

// Actualizar cliente
export const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { direccion_envio, telefono_contacto, metodo_pago } = req.body;

  try {
    const query = `
      UPDATE clientes
      SET 
        direccion_envio = COALESCE($1, direccion_envio),
        telefono_contacto = COALESCE($2, telefono_contacto),
        metodo_pago = COALESCE($3, metodo_pago)
      WHERE id_cliente = $4
      RETURNING id_cliente, id_usuario;
    `;
    const result = await pool.query(query, [direccion_envio, telefono_contacto, metodo_pago, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    return res.json({ mensaje: "Cliente actualizado correctamente", cliente: result.rows[0] });
  } catch (err) {
    console.error("Error al actualizar cliente:", err);
    return res.status(500).json({ mensaje: "Error al actualizar cliente" });
  }
};

// Eliminar cliente (solo el perfil, no el usuario)
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM clientes WHERE id_cliente = $1 RETURNING id_usuario", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    return res.json({ mensaje: "Perfil de cliente eliminado correctamente", id_usuario: result.rows[0].id_usuario });
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    return res.status(500).json({ mensaje: "Error al eliminar cliente" });
  }
};