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

  const bccList = recipientEmails.join(',');

  const mailOptions = {
    from: `"OnWheels Admin" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    bcc: bccList,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #1976d2;">Comunicado Importante</h2>
        <div style="font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Has recibido este correo por ser parte de la comunidad OnWheels.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Generic mass email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending generic mass email:', error);
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
