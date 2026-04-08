import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Testing connection with:', process.env.EMAIL_USER);

async function test() {
  try {
    await transporter.verify();
    console.log('✅ Connection successful!');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email OnWheels',
      text: 'This is a test email to verify configuration.',
    });
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

test();
