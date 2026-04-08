import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMassEventEmail = async (eventData, recipientEmails) => {
  if (!recipientEmails || recipientEmails.length === 0) {
    console.log("No recipients found for mass email.");
    return;
  }

  // Comma-separated list of BCC recipients to hide emails from each other
  // and send in a single batch (check limits for your ISP/Service)
  const bccList = recipientEmails.join(',');

  const mailOptions = {
    from: `"OnWheels Support" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to self, BCC everyone else
    bcc: bccList,
    subject: `Nuevo Evento: ${eventData.nombre_evento}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #d32f2f;">¡Nuevo Evento en OnWheels!</h1>
        <p>Hola,</p>
        <p>Nos complace invitarte a nuestro próximo evento:</p>
        
        <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="margin-top: 0;">${eventData.nombre_evento}</h2>
          <p><strong>Fecha:</strong> ${eventData.fecha_evento}</p>
          <p><strong>Hora:</strong> ${eventData.hora_inicio}</p>
          <p><strong>Descripción:</strong></p>
          <p>${eventData.descripcion}</p>
        </div>

        <p>¡No te lo pierdas!</p>
        <p>Atentamente,<br>El equipo de OnWheels</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Mass email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending mass email:', error);
  }
};

export const sendGenericMassEmail = async (subject, message, recipientEmails) => {
  if (!recipientEmails || recipientEmails.length === 0) {
    return { success: false, message: "No recipients provided" };
  }

  console.log(`📨 Iniciando envío individual de ${recipientEmails.length} correos...`);

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Sent individually to avoid BCC spam filters and provide better tracking
  const sendPromises = recipientEmails.map(async (email) => {
    const mailOptions = {
      from: `"OnWheels Admin" <${process.env.EMAIL_USER}>`,
      to: email, 
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #16315f; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">OnWheels</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #16315f; margin-top: 0;">Comunicado Importante</h2>
            <div style="font-size: 16px; line-height: 1.7; color: #555; white-space: pre-wrap;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
              Has recibido este correo por ser parte de la comunidad OnWheels.<br>
              &copy; 2024 OnWheels - Todos los derechos reservados.
            </div>
          </div>
        </div>
      `,
    };

    try {
      // Timeout de 10 segundos por correo para evitar bloqueos
      const sendPromiseWithTimeout = Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 10s alcanzado')), 10000))
      ]);

      await sendPromiseWithTimeout;
      console.log(`✅ Correo enviado a: ${email}`);
      return { email, status: 'fulfilled' };
    } catch (error) {
      console.error(`❌ Error enviando a ${email}:`, error.message);
      return { email, status: 'rejected', error: error.message };
    }
  });

  const settleResults = await Promise.allSettled(sendPromises);
  
  settleResults.forEach((res) => {
    // res.value contains our custom object with email and status
    const actualResult = res.value;
    if (actualResult.status === 'fulfilled') results.success++;
    else {
      results.failed++;
      results.errors.push({ email: actualResult.email, error: actualResult.error });
    }
  });

  console.log(`🏁 Resumen de envío: ${results.success} exitosos, ${results.failed} fallidos.`);

  if (results.success === 0 && recipientEmails.length > 0) {
    throw new Error(`No se pudo enviar ningún correo. Último error: ${results.errors[0]?.error || 'Desconocido'}`);
  }

  return { 
    success: true, 
    total: recipientEmails.length,
    enviados: results.success,
    fallidos: results.failed
  };
};



// Enviar correo individual a un solo destinatario
export const sendIndividualEmail = async (destinatario, asunto, mensaje) => {
  if (!destinatario || !asunto || !mensaje) {
    throw new Error("Faltan campos requeridos: destinatario, asunto o mensaje");
  }

  const mailOptions = {
    from: `"OnWheels" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #040529; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #F0E6E6; margin: 0;">🛹 OnWheels</h2>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #eee; border-radius: 0 0 8px 8px;">
          <div style="font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
            ${mensaje.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Equipo OnWheels &mdash; ¡Bienvenido a la familia!</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo individual enviado a:', destinatario, '| ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar correo individual:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Reusing the existing transporter strategy or creating a new one if specific configs needed
    // The user provided specific config but it matches the global one mostly.
    
    // Construct reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Ensure no double slashes
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Recupera tu contraseña - Performance-SB',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
          <a href="${resetLink}" style="background: #0a56a5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
          <p>Este enlace expira en 1 hora.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo de recuperación enviado a:', email);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de recuperación:', error);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
};
