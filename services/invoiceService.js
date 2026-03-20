// services/invoiceService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInvoiceEmail = async (email, venta, items) => {
  const nombreCliente = venta.nombre_cliente || "Cliente";
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">
        ${item.url_imagen ? `<img src="${item.url_imagen}" width="50" style="border-radius: 8px; object-fit: cover; aspect-ratio: 1/1;" alt="${item.nombre_producto || 'Producto'}">` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre_producto || 'Producto'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre_color || 'N/A'} / ${item.nombre_talla || 'N/A'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${Number(item.precio_unitario).toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  const mailOptions = {
    from: `"Performance SB Shop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Comprobante de pago - Performance SB`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="text-align: center; color: #1E3A8A;">Comprobante de  de Compra</h2>
        <p>Hola ${nombreCliente},</p>
        <p>Gracias por tu compra en <strong>Performance SB</strong>. Aquí tienes los detalles de tu pedido:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">Imagen</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Producto</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Variante</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">Cant.</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="4" style="padding: 8px; text-align: right;">Total:</th>
              <th style="padding: 8px; text-align: right; color: #1E3A8A;">$${Number(venta.total).toLocaleString()}</th>
            </tr>
          </tfoot>
        </table>
        
        <p style="margin-top: 30px;">Método de Pago: ${venta.metodo_pago}</p>
        <p>Fecha: ${new Date(venta.fecha_venta).toLocaleDateString()}</p>
        
        <div style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Performance SB - Todos los derechos reservados.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${email}`);
  } catch (error) {
    console.error("Error sending invoice email:", error);
  }
};
