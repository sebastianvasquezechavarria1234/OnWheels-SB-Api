import { sendGenericMassEmail } from "../services/emailService.js";
import {
  getRolesDisponibles,
  getCorreosPorRoles,
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

    // Obtener destinatarios desde el modelo
    const destinatarios = await getCorreosPorRoles(idsRoles);
    
    if (destinatarios.length === 0) {
      return res.status(400).json({ msg: "No hay usuarios activos con emails en los roles seleccionados" });
    }

    const emails = destinatarios.map(r => r.correo);

    // 1. Guardar en historial PRIMERO
    // Guardamos estado 'en_proceso' o 'completado' según lógica, aquí asumimos completado como meta de registro,
    // o podríamos actualizarlo si el envío falla.
    const rolesStr = rolesNombres ? rolesNombres.join(", ") : "Varios";
    const envio = await crearEnvioMasivo(asunto, mensaje, rolesStr, destinatarios.length);
    
    // 2. Guardar detalle de destinatarios
    await insertarDestinatarios(envio.id_envio, destinatarios);

    // 3. Enviar el correo
    // Intentamos enviar. Si falla, no perdemos el registro, solo notificamos el error.
    try {
      await sendGenericMassEmail(asunto, mensaje, emails);
      res.json({
        success: true,
        data: {
          mensaje: `Correo enviado exitosamente a ${emails.length} destinatarios.`
        }
      });
    } catch (sendError) {
      console.error("Error al enviar correos (nodemailer):", sendError);
      
      // Podríamos actualizar el estado en DB a 'error' si quisiéramos ser más estrictos
      // await marcarEnvioError(envio.id_envio); // (si existiera esa función)

      // Retornamos 200 con advertencia o 500 según preferencia. 
      // Dado que se guardó, mejor retornar éxito parcial o error controlado.
      return res.status(200).json({ 
        success: true, 
        data: {
           mensaje: `El registro se guardó, pero hubo un problema enviando los correos: ${sendError.message}`
        }
      });
    }

  } catch (error) {
    console.error("Error enviando correos masivos:", error);
    res.status(500).json({ msg: "Error al procesar la solicitud", error: error.message });
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
