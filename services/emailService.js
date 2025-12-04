// backend/services/emailService.js
import * as nodemailer from 'nodemailer';

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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
    });

    console.log('✅ Correo enviado a:', email);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
};