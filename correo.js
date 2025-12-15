// node.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "emanuelgj666@gmail.com",
    pass: "emckpqedxkititbr"
  }
});

let mail = {
  from: "emanuelgj666@gmail.com", 
  to: "cg8062116@gmail.com",
  subject: "Prueba Nodemailer", 
  text: "Hola",
  html: "<h5>Cabezon</h5>"
};

transporter.sendMail(mail, (error, info) => {
  if (error) {
    console.error("Error al enviar correo:", error);
  } else {
    console.log("Correo enviado: " + info.response);
  }
});