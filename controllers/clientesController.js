// controllers/clientesController.js
import pool from "../db/postgresPool.js";

// Obtener todos los clientes con info de usuario
export const getClientes = async (req, res) => {
  console.log("🔍 getClientes: solicitud recibida");
  console.log("Headers:", Object.keys(req.headers));
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

// Obtener perfil del cliente logueado
export const getMyClientProfile = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario; // Asumiendo que el middleware de auth populo esto

    if (!id_usuario) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

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
      WHERE c.id_usuario = $1;
    `;

    const result = await pool.query(query, [id_usuario]);

    // Si no tiene perfil de cliente, devolvemos info basica del usuario para pre-llenar
    if (result.rows.length === 0) {
      // Buscar solo usuario
      const userRes = await pool.query("SELECT nombre_completo, email, telefono, documento FROM usuarios WHERE id_usuario = $1", [id_usuario]);
      if (userRes.rows.length === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });

      return res.json({
        exists: false,
        ...userRes.rows[0] // Datos base para el form
      });
    }

    return res.json({
      exists: true,
      ...result.rows[0]
    });

  } catch (err) {
    console.error("Error al obtener mi perfil de cliente:", err);
    return res.status(500).json({ mensaje: "Error al obtener perfil" });
  }
};

// Crear cliente → NO usa autenticación (como el CRUD de estudiantes)
// controllers/clientesController.js


export const createCliente = async (req, res) => {
  // 🔍 Depuración temporal (puedes eliminar después)
  console.log("📥 createCliente recibido body:", req.body);

  const { id_usuario, direccion_envio, telefono_contacto, metodo_pago } = req.body;

  // Validaciones iniciales
  if (!id_usuario) {
    return res.status(400).json({ mensaje: "id_usuario es obligatorio" });
  }

  if (!direccion_envio || typeof direccion_envio !== 'string' || direccion_envio.trim() === '') {
    return res.status(400).json({ mensaje: "direccion_envio es obligatoria y debe ser un texto válido" });
  }

  if (telefono_contacto && (typeof telefono_contacto !== 'string' || !/^\d{7,15}$/.test(telefono_contacto))) {
    return res.status(400).json({ mensaje: "telefono_contacto debe ser una cadena de 7 a 15 dígitos" });
  }

  const metodosPermitidos = ['tarjeta', 'efectivo', 'transferencia', 'nequi', 'daviplata'];
  if (metodo_pago && !metodosPermitidos.includes(metodo_pago)) {
    return res.status(400).json({ mensaje: "método de pago no válido" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar que el usuario exista y esté activo
    const userCheck = await client.query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = true",
      [id_usuario]
    );
    if (userCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ mensaje: "Usuario no existe o está inactivo" });
    }

    // Verificar que no sea ya cliente
    const clienteExists = await client.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = $1",
      [id_usuario]
    );
    if (clienteExists.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ mensaje: "Este usuario ya es cliente" });
    }

    // Insertar nuevo cliente
    const query = `
      INSERT INTO clientes (id_usuario, direccion_envio, telefono_contacto, metodo_pago)
      VALUES ($1, $2, $3, $4)
      RETURNING id_cliente;
    `;
    const result = await client.query(query, [
      id_usuario,
      direccion_envio.trim(),
      telefono_contacto || null,
      metodo_pago || null
    ]);

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Cliente creado correctamente",
      id_cliente: result.rows[0].id_cliente,
      id_usuario
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear cliente:", err);

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
    const fields = [];
    const values = [];
    let index = 1;

    if (direccion_envio !== undefined) {
      if (typeof direccion_envio !== 'string' || direccion_envio.trim() === '') {
        return res.status(400).json({ mensaje: "direccion_envio debe ser un texto válido" });
      }
      fields.push(`direccion_envio = $${index++}`);
      values.push(direccion_envio.trim());
    }
    if (telefono_contacto !== undefined) {
      if (telefono_contacto !== null && (typeof telefono_contacto !== 'string' || !/^\d{7,15}$/.test(telefono_contacto))) {
        return res.status(400).json({ mensaje: "telefono_contacto debe ser una cadena de 7 a 15 dígitos o null" });
      }
      fields.push(`telefono_contacto = $${index++}`);
      values.push(telefono_contacto);
    }
    if (metodo_pago !== undefined) {
      const metodosPermitidos = ['tarjeta', 'efectivo', 'transferencia', 'nequi', 'daviplata'];
      if (metodo_pago !== null && !metodosPermitidos.includes(metodo_pago)) {
        return res.status(400).json({ mensaje: "método de pago no válido" });
      }
      fields.push(`metodo_pago = $${index++}`);
      values.push(metodo_pago);
    }

    if (fields.length === 0) {
      return res.status(400).json({ mensaje: "No se envió ningún campo para actualizar" });
    }

    values.push(id);
    const query = `
      UPDATE clientes
      SET ${fields.join(', ')}
      WHERE id_cliente = $${index}
      RETURNING id_cliente, id_usuario;
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    return res.json({
      mensaje: "Cliente actualizado correctamente",
      cliente: result.rows[0]
    });
  } catch (err) {
    console.error("Error al actualizar cliente:", err);
    return res.status(500).json({ mensaje: "Error al actualizar cliente" });
  }
};

// Eliminar cliente
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM clientes WHERE id_cliente = $1 RETURNING id_usuario", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    return res.json({
      mensaje: "Perfil de cliente eliminado correctamente",
      id_usuario: result.rows[0].id_usuario
    });
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    return res.status(500).json({ mensaje: "Error al eliminar cliente" });
  }
};