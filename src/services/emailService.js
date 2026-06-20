const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendWelcomeEmail(to, name) {
    try {
      // Solo intentamos enviar si las credenciales de correo existen
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Advertencia: Variables de entorno para Email no configuradas. Saltando envío de correo.');
        return;
      }

      const mailOptions = {
        from: `"Archivo Folklore" <${process.env.EMAIL_USER}>`,
        to,
        subject: '¡Bienvenido al Archivo Folklore!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hola ${name},</h2>
            <p>Gracias por registrarte en el <strong>Archivo Folklore</strong>. Tu cuenta ha sido creada exitosamente y estamos felices de tenerte con nosotros.</p>
            <br/>
            <p>Saludos,</p>
            <p>El equipo de Archivo Folklore</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado exitosamente: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
      // No lanzamos el error para no interrumpir el flujo de registro si el correo falla
    }
  }
}

module.exports = new EmailService();
