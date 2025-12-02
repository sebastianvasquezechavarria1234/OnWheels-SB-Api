import { EmailMasivo } from "../models/EnvioMasivoModel.js";

export const enviarCorreosMasivos = async (req, res) => {
  try {
    const { asunto, mensaje, destinatarios } = req.body;

    if (!destinatarios || destinatarios.length === 0) {
      return res.status(400).json({ msg: "No hay destinatarios" });
    }

    // 1. Crear registro principal
    const envio = await EmailMasivo.crearEnvio(asunto, mensaje, destinatarios.length);

    // 2. Crear detalles
    for (const correo of destinatarios) {
      await EmailMasivo.agregarDetalle(envio.id_envio, correo, mensaje);
    }

    res.json({
      msg: "Envio registrado. El worker enviará todo automáticamente.",
      id_envio: envio.id_envio
    });

  } catch (err) {
    console.error("Error al registrar envío masivo:", err);
    res.status(500).json({ msg: "Error procesando envío", error: err.message });
  }
};
