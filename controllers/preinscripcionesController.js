// controllers/preinscripcionesController.js
import pool from "../db/postgresPool.js";
import {
  crearPreinscripcion,
  obtenerPreinscripcionesPendientes,
  obtenerEstudiantePorId,
} from "../models/EstudiantesModel.js";
import { crearMatricula } from "../models/matriculasModel.js";

// ================================
// Crear preinscripción (con lógica completa de menores y transacciones)
// ================================
const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export const crearPreinscripcionCtrl = async (req, res) => {
  const client = await pool.connect();
  try {
    console.log("📥 [Preinscripción] Inicio de solicitud:", req.body);
    console.log("🚀 [DEBUG] CONFIRMACIÓN DE CÓDIGO NUEVO - V2.0");
    let {
      id_usuario, // Viene del frontend (auth user id)
      enfermedad,
      nivel_experiencia,
      edad,
      id_acudiente, // Puede venir si selecciona uno existente
      nuevoAcudiente, // Objeto si crea uno nuevo
      tipo_preinscripcion, // "PROPIA" | "TERCERO"
      datos_tercero // { nombre_completo, email, genero }
    } = req.body;

    // Aseguramos que sea entero si viene como string
    id_usuario = parseInt(id_usuario);

    console.log("🔍 [Preinscripción] Datos extraídos:", { tipo_preinscripcion, id_usuario, edad, nivel_experiencia });

    // Validación básica
    if (!tipo_preinscripcion || !nivel_experiencia) {
      await client.release();
      return res.status(400).json({ mensaje: "Faltan campos obligatorios (tipo, nivel)" });
    }

    // Iniciar transacción
    await client.query("BEGIN");

    let studentUserId = null; // El usuario que será el "estudiante"
    let finalIdAcudiente = null;
    let tempPassword = null;
    let isNewUser = false;

    // =========================================================================
    // CASO 1: PREINSCRIPCIÓN PARA TERCERO (Hijo / Acudido)
    // =========================================================================
    if (tipo_preinscripcion === "TERCERO") {
      let { nombre_completo, email, fecha_nacimiento, genero, documento, tipo_documento, telefono } = datos_tercero || {};

      if (!nombre_completo || !email || !edad) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ mensaje: "Faltan datos obligatorios del tercero (nombre, email, edad)" });
      }

      // Si no viene fecha_nacimiento, calculamos una aproximada basada en la edad para no romper el esquema
      if (!fecha_nacimiento) {
        const year = new Date().getFullYear() - parseInt(edad);
        fecha_nacimiento = `${year}-01-01`;
      }

      // Validación de edad para terceros
      if (tipo_preinscripcion === 'TERCERO') {
          const userAge = calculateAge(req.user.fecha_nacimiento);
          if (userAge < 18) {
              return res.status(403).json({
                  mensaje: "Lo sentimos, debes ser mayor de edad para preinscribir a otra persona.",
                  error: "menor_de_edad"
              });
          }
      }

      // 1. Validar si el email del tercero ya existe (Seguridad)
      const emailCheck = await client.query("SELECT id_usuario FROM usuarios WHERE email = $1", [email]);
      if (emailCheck.rowCount > 0) {
        console.warn("⚠️ [Preinscripción] Email ya registrado:", email);
        await client.query("ROLLBACK");
        client.release();
        return res.status(409).json({
          mensaje: "El correo electrónico de la persona a preinscribir ya está registrado en el sistema. Por favor, usa otro correo.",
          error: "email_duplicado"
        });
      }

      // 2. Generar Token de Activación (No contraseña)
      const crypto = await import("crypto");
      const activationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // 3. Crear Usuario del Tercero (Rol CLIENTE, Inactivo)
      const insertUserQuery = `
                INSERT INTO usuarios (nombre_completo, email, contrasena, fecha_nacimiento, estado, documento, tipo_documento, telefono, activation_token, token_expiration)
                VALUES ($1, $2, $3, $4, false, $5, $6, $7, $8, $9) 
                RETURNING id_usuario
            `;
      // Nota: Se usa una contraseña dummy no utilizable para cumplir restricción NOT NULL si existe
      const dummyPass = "$2a$10$UnusablePasswordHashForSecurityReasonsToForceActivationFlow";

      const newUserRes = await client.query(insertUserQuery, [
        nombre_completo,
        email,
        dummyPass,
        fecha_nacimiento,
        documento || 'NO_DOC',
        tipo_documento || 'CC',
        telefono || '0000000000',
        activationToken,
        tokenExpiration
      ]);
      studentUserId = newUserRes.rows[0].id_usuario;
      isNewUser = true;

      // 4. Asignar Rol CLIENTE
      const rolRes = await client.query("SELECT id_rol FROM roles WHERE nombre_rol ILIKE 'Cliente'");
      if (rolRes.rowCount > 0) {
        await client.query(
          "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES ($1, $2)",
          [studentUserId, rolRes.rows[0].id_rol]
        );
      }
      console.log("✅ [Preinscripción] Usuario TERCERO creado. ID:", studentUserId);

      // 3. Vincular Acudiente (El usuario autenticado/padre es el acudiente)
      // Buscamos si el usuario autenticado (req.user o id_usuario enviado) ya es acudiente
      // NOTA: id_usuario aquí es el del PADRE (quien hace la request)
      const parentUserId = id_usuario;
      console.log(`👨‍👦 [Preinscripción] Buscando padre ID: ${parentUserId} (Type: ${typeof parentUserId})`);

      // 4. Obtener datos del padre (usuario autenticado) para vincular acudiente
      // Usamos SELECT * para evitar errores de columnas específicas por ahora, y query simple
      const parentUserQuery = "SELECT * FROM usuarios WHERE id_usuario = $1";
      const parentUser = await client.query(parentUserQuery, [parentUserId]);

      if (parentUser.rows.length === 0) {
        console.error(`❌ [Preinscripción] No se encontró usuario con ID ${parentUserId}`);
        throw new Error("Usuario padre no encontrado en la base de datos.");
      }

      // Verificar si ya existe en tabla acudientes por EMAIL
      const existingAcudiente = await client.query(
        "SELECT id_acudiente FROM acudientes WHERE email = $1",
        [parentUser.rows[0]?.email]
      );

      // (Nota: moví la búsqueda del usuario padre antes para tener el email)

      if (existingAcudiente.rows.length > 0) {
        finalIdAcudiente = existingAcudiente.rows[0].id_acudiente;
        console.log("✅ [Preinscripción] Acudiente existente encontrado por email. ID:", finalIdAcudiente);
      } else {
        // Si no existe, lo creamos copiando datos básicos del usuario
        const { nombre_completo, telefono, email } = parentUser.rows[0];

        const newAcudiente = await client.query(
          `INSERT INTO acudientes (nombre_acudiente, telefono, email, relacion)
           VALUES ($1, $2, $3, 'Padre/Madre/Tutor')
           RETURNING id_acudiente`,
          [nombre_completo, telefono, email]
        );
        finalIdAcudiente = newAcudiente.rows[0].id_acudiente;
        console.log("✨ [Preinscripción] Nuevo acudiente creado para el padre. ID:", finalIdAcudiente);
      }

      // 6. Enviar Correo de Activación (NO bloqueante)
      try {
        const nodemailer = (await import("nodemailer")).default;

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/activar-cuenta?token=${activationToken}`;

        // Log para debug manual si falla el correo
        console.log("📧 [Preinscripción] Link de activación (Backup):", activationLink);

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: email,
          subject: "Activa tu cuenta en OnWheels",
          html: `
            <h1>Bienvenido a OnWheels</h1>
            <p>Para completar tu registro, por favor activa tu cuenta haciendo clic en el siguiente enlace:</p>
            <a href="${activationLink}">Activar Cuenta</a>
            <p>Este enlace expira en 24 horas.</p>
          `
        };

        // Fire & Forget: No usamos await para no bloquear ni arriesgar la transacción
        transporter.sendMail(mailOptions)
          .then(() => console.log("✅ [Preinscripción] Correo enviado a:", email))
          .catch((err) => console.error("⚠️ [Preinscripción] Falló envío correo (Async):", err.message));


      } catch (emailError) {
        console.error("⚠️ [Preinscripción] Falló el envío del correo (No crítico):", emailError.message);
        // NO hacemos ROLLBACK. El usuario se crea igual.
      }
    }
    // =========================================================================
    // CASO 2: PREINSCRIPCIÓN PROPIA (Usuario logueado)
    // =========================================================================
    else {
      if (!id_usuario) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ mensaje: "Usuario no identificado para inscripción propia" });
      }
      studentUserId = id_usuario;

      // Lógica original de acudiente para menores (si aplica)
      if (edad < 18) {
        const { nuevoAcudiente, id_acudiente: idAcudienteForm } = req.body;

        // Opción A: Acudiente existente seleccionado
        if (idAcudienteForm) {
          finalIdAcudiente = idAcudienteForm;
        }
        // Opción B: Nuevo acudiente
        else if (nuevoAcudiente) {
          const { nombre_acudiente, telefono, email: emailAcu, relacion } = nuevoAcudiente;
          if (!nombre_acudiente || !telefono || !emailAcu || !relacion) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(400).json({ mensaje: "Faltan datos del acudiente" });
          }
          const acudienteRes = await client.query(
            `INSERT INTO acudientes (nombre_acudiente, telefono, email, relacion)
                         VALUES ($1, $2, $3, $4) RETURNING id_acudiente`,
            [nombre_acudiente, telefono, emailAcu, relacion]
          );
          finalIdAcudiente = acudienteRes.rows[0].id_acudiente;
        }

        if (!finalIdAcudiente) {
          await client.query("ROLLBACK");
          client.release();
          return res.status(400).json({ mensaje: "Menor de edad requiere acudiente" });
        }
      }
    }

    // =========================================================================
    // VERIFICACIONES FINALES COMUNES Y CREACIÓN DE ESTUDIANTE
    // =========================================================================

    // Validar que NO exista ya una preinscripción pendiente para este studentUserId
    console.log(`🔎 [Preinscripción] Verificando duplicados para StudentID: ${studentUserId} (AuthUser: ${id_usuario})`);
    const existente = await client.query(
      "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $1 AND estado != 'Rechazado'",
      [studentUserId]
    );
    // Nota: Ajustado a verificar si ya existe registro. 
    // Si quieres permitir re-inscripción solo si fue rechazado, la query está bien.
    // Si tiene 'Activo', tampoco debería dejar.

    if (existente.rowCount > 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(409).json({ mensaje: "El usuario ya tiene una preinscripción o es estudiante activo" });
    }

    // Crear registro en estudiantes
    console.log("📝 [Preinscripción] Creando registro de estudiante...");
    const datosPreinscripcion = {
      id_usuario: studentUserId,
      enfermedad: enfermedad || "No aplica",
      nivel_experiencia,
      edad,
      id_acudiente: finalIdAcudiente,
    };

    const nuevaPreinscripcion = await crearPreinscripcion(datosPreinscripcion, client);
    console.log("✅ [Preinscripción] Estudiante creado exitosamente. ID:", nuevaPreinscripcion.id_estudiante);

    await client.query("COMMIT");
    client.release();

    res.status(201).json({
      mensaje: "Preinscripción creada correctamente. Por favor verifica tu correo para activar la cuenta.",
      preinscripcion: nuevaPreinscripcion
    });

  } catch (error) {
    console.error("❌ [Preinscripción] Error CRÍTICO capturado:", error);
    console.error("❌ [Preinscripción] Stack Trace:", error.stack);
    if (client) {
      try { await client.query("ROLLBACK"); } catch (e) { }
      client.release();
    }
    // Return explicit error message
    res.status(400).json({
      mensaje: error.message || "Error al crear preinscripción",
      detalle: error.stack // Optional: remove in production
    });
  }
};

// ================================
// Funciones restantes: usan modelos (como en Controller B)
// ================================

export const listarPreinscripcionesPendientes = async (req, res) => {
  try {
    const preinscripciones = await obtenerPreinscripcionesPendientes();
    res.status(200).json(preinscripciones);
  } catch (error) {
    console.error("Error al listar preinscripciones pendientes:", error);
    res.status(500).json({ mensaje: "Error al listar preinscripciones pendientes" });
  }
};

export const obtenerPreinscripcionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const preinscripcion = await obtenerEstudiantePorId(id);

    if (!preinscripcion || preinscripcion.estado !== "Pendiente") {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }

    res.status(200).json(preinscripcion);
  } catch (error) {
    console.error("Error al obtener preinscripción:", error);
    res.status(500).json({ mensaje: "Error al obtener preinscripción" });
  }
};

export const rechazarPreinscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE estudiantes SET estado = 'Rechazado' WHERE id_estudiante = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: "Preinscripción no encontrada" });
    }
    res.status(200).json({ mensaje: "Preinscripción rechazada correctamente" });
  } catch (error) {
    console.error("Error al rechazar preinscripción:", error);
    res.status(500).json({ mensaje: "Error al rechazar preinscripción" });
  }
};

export const aceptarPreinscripcionYCrearMatricula = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { id_clase, id_plan, fecha_matricula } = req.body;

    if (!id_clase || !id_plan) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({
        mensaje: "id_clase e id_plan son obligatorios para crear la matrícula",
      });
    }

    const preinscripcion = await obtenerEstudiantePorId(id);
    if (!preinscripcion || preinscripcion.estado !== "Pendiente") {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ mensaje: "Preinscripción no encontrada o ya procesada" });
    }

    const clase = await client.query("SELECT id_clase FROM clases WHERE id_clase = $1 AND estado = 'Disponible'", [id_clase]);
    if (clase.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ mensaje: "Clase no disponible" });
    }

    const plan = await client.query("SELECT id_plan FROM planes_clases WHERE id_plan = $1", [id_plan]);
    if (plan.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ mensaje: "Plan no encontrado" });
    }

    await client.query("UPDATE estudiantes SET estado = 'Activo' WHERE id_estudiante = $1", [id]);

    const matricula = await crearMatricula({
      id_estudiante: id,
      id_clase,
      id_plan,
      fecha_matricula,
      estado: "Activa"
    }, client); // ← Si tu modelo acepta cliente, pásalo

    await client.query("COMMIT");
    client.release();

    res.status(200).json({
      mensaje: "Preinscripción aceptada y matrícula creada correctamente",
      matricula
    });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error al aceptar preinscripción:", error);
    res.status(500).json({
      mensaje: error.message || "Error al aceptar preinscripción"
    });
  }
};