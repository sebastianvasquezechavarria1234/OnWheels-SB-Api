import sgMail from "@sendgrid/mail";
import { EmailMasivo } from "../models/EnvioMasivoModel.js";

sgMail.setApiKey(process.env.SENDGRID_KEY);

const worker = async () => {
  const pendientes = await EmailMasivo.obtenerPendientes();

  for (const detalle of pendientes) {
    try {
      await sgMail.send({
        to: detalle.correo,
        from: "soporte@performance.com",
        subject: "Notificación Performance",
        html: detalle.mensaje
      });

      await EmailMasivo.marcarEnviado(detalle.id_detalle);

    } catch (error) {
      await EmailMasivo.marcarError(detalle.id_detalle, error.message);
    }
  }
};

setInterval(worker, 5000);

console.log("🚀 Worker de correos iniciado cada 5 segundos");
