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
    export const crearPreinscripcionCtrl = async (req, res) => {
      const client = await pool.connect();
      try {
        const { 
          id_usuario, 
          enfermedad, 
          nivel_experiencia, 
          edad, 
          id_acudiente, 
          nuevoAcudiente 
        } = req.body;

        // Validación básica
        if (!id_usuario || !nivel_experiencia || !edad) {
          await client.release();
          return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
        }

        // Iniciar transacción
        await client.query("BEGIN");

        let finalIdAcudiente = id_acudiente;

        // Si es menor y se envía nuevoAcudiente, créalo
        if (edad < 18 && nuevoAcudiente) {
          const { nombre_acudiente, telefono, email, relacion } = nuevoAcudiente;
          if (!nombre_acudiente || !telefono || !email || !relacion) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(400).json({ mensaje: "Faltan datos del acudiente" });
          }
          const acudienteRes = await client.query(
            `INSERT INTO acudientes (nombre_acudiente, telefono, email, relacion)
            VALUES ($1, $2, $3, $4) RETURNING id_acudiente`,
            [nombre_acudiente, telefono, email, relacion]
          );
          finalIdAcudiente = acudienteRes.rows[0].id_acudiente;
        }

        // Si es menor y no hay acudiente, error
        if (edad < 18 && !finalIdAcudiente) {
          await client.query("ROLLBACK");
          client.release();
          return res.status(400).json({ mensaje: "Se requiere información del acudiente para menores de edad" });
        }

        // Validar que el usuario exista
        const userRes = await client.query("SELECT id_usuario FROM usuarios WHERE id_usuario = $1", [id_usuario]);
        if (userRes.rowCount === 0) {
          await client.query("ROLLBACK");
          client.release();
          return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        // Validar que no tenga ya una preinscripción (en cualquier estado)
        const existente = await client.query(
          "SELECT id_estudiante FROM estudiantes WHERE id_usuario = $1",
          [id_usuario]
        );
        if (existente.rowCount > 0) {
          await client.query("ROLLBACK");
          client.release();
          return res.status(409).json({ mensaje: "Ya tienes una preinscripción pendiente" });
        }

        // Preparar datos para el modelo
        const datosPreinscripcion = {
          id_usuario,
          enfermedad: enfermedad || "No aplica",
          nivel_experiencia,
          edad,
          id_acudiente: finalIdAcudiente,
        };

        // Usar el modelo para crear (pero dentro de la transacción)
        const nuevaPreinscripcion = await crearPreinscripcion(datosPreinscripcion, client);

        await client.query("COMMIT");
        client.release();

        res.status(201).json({
          mensaje: "Preinscripción creada correctamente",
          preinscripcion: nuevaPreinscripcion,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        client.release();
        console.error("Error al crear preinscripción:", error);
        if (error.message.includes("Usuario no encontrado")) {
          return res.status(404).json({ mensaje: error.message });
        }
        if (error.message.includes("Ya tienes una preinscripción pendiente")) {
          return res.status(409).json({ mensaje: error.message });
        }
        res.status(400).json({ mensaje: error.message || "Error al crear preinscripción" });
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

        const rolEstudiante = await client.query("SELECT id_rol FROM roles WHERE nombre_rol = 'Estudiante' AND estado = true");
        if (rolEstudiante.rowCount > 0) {
          await client.query(
            `INSERT INTO usuario_roles (id_usuario, id_rol) 
            VALUES ($1, $2) 
            ON CONFLICT (id_usuario, id_rol) DO NOTHING`,
            [preinscripcion.id_usuario, rolEstudiante.rows[0].id_rol]
          );
        }

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