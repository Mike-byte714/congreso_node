const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: to,
      subject: subject,
      html: `
        <html>
        <head><title>${subject}</title></head>
        <body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;'>
            <div style='max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;'>
                <h2 style='color: #0d9488;'>Congreso Internacional TESCo 2026</h2>
                ${htmlContent}
                <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                <p style='font-size: 12px; color: #999;'>Este es un mensaje automático, por favor no responda a este correo.</p>
            </div>
        </body>
        </html>
      `
    });
    console.log("Mensaje enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar correo: ", error);
    return false;
  }
};

module.exports = { sendEmail };
