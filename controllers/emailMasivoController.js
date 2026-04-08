import { sendGenericMassEmail, sendIndividualEmail } from "../services/emailService.js";
import {
  getRolesDisponibles,
  getCorreosPorRoles,
  getCantidadCorreosPorRoles,
  crearEnvioMasivo,
  insertarDestinatarios,
  getHistorialEnvios,
  eliminarEnvio
} from "../models/emailMasivoModel.js";

// Obtener roles con cantidad de usuarios activos
export const obtenerRolesDisponibles = async (req, res) => {
  try {
    const rows = await getRolesDisponibles();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo roles:", error);
    res.status(500).json({ msg: "Error al obtener roles", error: error.message });
  }
};

// Obtener vista previa de destinatarios por roles seleccionados
export const obtenerVistaPreviaDestinatarios = async (req, res) => {
  try {
    const { idsRoles } = req.body; // Array de IDs de rol

    if (!idsRoles || !Array.isArray(idsRoles) || idsRoles.length === 0) {
      return res.status(400).json({ msg: "Se requieren roles válidos" });
    }

    const rows = await getCorreosPorRoles(idsRoles);

    // Agrupar por rol para la vista previa
    const porRol = {};
    rows.forEach(row => {
      if (!porRol[row.nombre_rol]) {
        porRol[row.nombre_rol] = [];
      }
      porRol[row.nombre_rol].push({
        id_usuario: row.id_usuario,
        nombre_completo: row.nombre_completo,
        correo: row.correo
      });
    });

    res.json({
      success: true,
      total: rows.length,
      porRol
    });
  } catch (error) {
    console.error("Error vista previa:", error);
    res.status(500).json({ msg: "Error al generar vista previa", error: error.message });
  }
};

// Enviar correos masivos
export const enviarCorreosMasivos = async (req, res) => {
  try {
    const { asunto, mensaje, idsRoles, rolesNombres } = req.body;

    if (!asunto || !mensaje || !idsRoles || idsRoles.length === 0) {
      return res.status(400).json({ msg: "Faltan datos requeridos" });
    }

    if (asunto.length < 3 || asunto.length > 255) {
        return res.status(400).json({ msg: "El asunto debe tener entre 3 y 255 caracteres" });
    }

    if (mensaje.length < 10 || mensaje.length > 10000) {
        return res.status(400).json({ msg: "El mensaje debe tener entre 10 y 10000 caracteres" });
    }

    const totalDestinatarios = await getCantidadCorreosPorRoles(idsRoles);

    if (totalDestinatarios === 0) {
      return res.status(400).json({ msg: "No hay usuarios activos con emails en los roles seleccionados" });
    }

    // 1. Guardar en historial PRIMERO
    // Guardamos estado 'en_proceso' o 'completado' según lógica, aquí asumimos completado como meta de registro,
    // o podríamos actualizarlo si el envío falla.
    console.log(`🚀 Iniciando proceso de envío masivo: "${asunto}"`);
    console.log(`📊 Destinatarios encontrados: ${totalDestinatarios}`);

    const rolesStr = rolesNombres ? rolesNombres.join(", ") : "Varios";
    
    console.log("💾 Guardando registro de envío en DB...");
    const envio = await crearEnvioMasivo(asunto, mensaje, rolesStr, totalDestinatarios);
    console.log(`✅ Registro de envío creado ID: ${envio.id_envio}`);
    
    // Responder inmediatamente al frontend para evitar timeout y mostrar alerta de creación
    res.json({
      success: true,
      data: {
        envio,
        mensaje: "El proceso de envío ha comenzado en segundo plano."
      }
    });

    // Proceso de registro y envío en segundo plano, fuera del ciclo de respuesta HTTP.
    setImmediate(async () => {
      try {
        const destinatarios = await getCorreosPorRoles(idsRoles);
        const emails = destinatarios.map(r => r.correo);

        console.log("👥 Guardando lista de destinatarios en DB...");
        await insertarDestinatarios(envio.id_envio, destinatarios);
        console.log("✅ Destinatarios guardados.");

        console.log("📧 Iniciando envío de correos en segundo plano...");
        const result = await sendGenericMassEmail(asunto, mensaje, emails);
        console.log(`🏁 Envío finalizado: ${result.enviados} exitosos, ${result.fallidos} fallidos.`);
      } catch (sendError) {
        console.error("❌ Error en el proceso de envío en segundo plano:", sendError.message);
      }
    });

  } catch (error) {
    console.error("Error enviando correos masivos:", error);
    if (!res.headersSent) {
      res.status(500).json({ msg: "Error al procesar la solicitud", error: error.message });
    }
  }
};

// Obtener historial de envíos
export const obtenerHistorialEnviosController = async (req, res) => {
  try {
    const historial = await getHistorialEnvios();
    res.json({ success: true, data: historial });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ msg: "Error al obtener historial", error: error.message });
  }
};

// Eliminar envío
export const eliminarEnvioController = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarEnvio(id);
    res.json({ success: true, message: "Registro eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando envío:", error);
    res.status(500).json({ msg: "Error al eliminar registro", error: error.message });
  }
};

// Enviar correo individual (para notificaciones de preinscripción aceptada, etc.)
export const enviarCorreoIndividual = async (req, res) => {
  try {
    const { destinatario, asunto, mensaje } = req.body;

    if (!destinatario || !asunto || !mensaje) {
      return res.status(400).json({ msg: "Faltan campos requeridos: destinatario, asunto, mensaje" });
    }

    await sendIndividualEmail(destinatario, asunto, mensaje);

    res.json({
      success: true,
      data: { mensaje: `Correo enviado correctamente a ${destinatario}` }
    });
  } catch (error) {
    console.error("Error enviando correo individual:", error);
    res.status(500).json({ msg: "Error al enviar correo individual", error: error.message });
  }
};
