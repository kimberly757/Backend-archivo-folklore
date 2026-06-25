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
          <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background-color: #fcfbfa; padding: 40px 20px; color: #281b18;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e8e4de;">
              <div style="background-color: #2c1e19; padding: 30px; text-align: center; border-bottom: 4px solid #C05640;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Archivo de Folklore</h1>
                <p style="color: #d1c9c7; margin: 8px 0 0 0; font-size: 11px; letter-spacing: 1.5px; font-weight: 700;">REGIÓN TÁCHIRA</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #281b18; margin-top: 0; font-size: 20px;">Hola ${name},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #807471;">
                  Gracias por registrarte en el <strong>Archivo de Folklore</strong>. Tu cuenta ha sido creada exitosamente y estamos felices de tenerte con nosotros.
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #807471;">
                  A partir de este momento, podrás acceder a nuestro sistema para colaborar en la preservación y difusión de nuestro patrimonio cultural.
                </p>
              </div>
              <div style="background-color: #fcfbfa; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e4de;">
                <p style="margin: 0; color: #807471; font-size: 13px;">Saludos cordiales,<br/><strong>El equipo de Archivo de Folklore</strong></p>
              </div>
            </div>
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

  async sendResetPasswordEmail(to, name, token) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Advertencia: Variables de entorno para Email no configuradas. Saltando envío de correo.');
        console.log(`\n🔑 [Recuperación de Contraseña] Token para ${to}:\n${token}\n`);
        return;
      }

      const mailOptions = {
        from: `"Archivo Folklore" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Recuperación de Contraseña - Archivo Folklore',
        html: `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background-color: #fcfbfa; padding: 40px 20px; color: #281b18;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e8e4de;">
              <div style="background-color: #2c1e19; padding: 30px; text-align: center; border-bottom: 4px solid #C05640;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Archivo de Folklore</h1>
                <p style="color: #d1c9c7; margin: 8px 0 0 0; font-size: 11px; letter-spacing: 1.5px; font-weight: 700;">REGIÓN TÁCHIRA</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #281b18; margin-top: 0; font-size: 20px;">Hola ${name},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #807471;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el <strong>Archivo de Folklore</strong>.
                </p>
                <div style="text-align: center; margin: 35px 0;">
                  <a href="http://localhost:5173/?token=${token}" style="display: inline-block; padding: 14px 28px; background-color: #C05640; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(192, 86, 64, 0.2);">Restablecer mi Contraseña</a>
                </div>
                <p style="font-size: 14px; line-height: 1.6; color: #807471;">
                  <em>Este enlace es válido por 1 hora.</em> Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                </p>
                <div style="background-color: #f7efe8; padding: 12px; border-radius: 6px; border: 1px dashed #e8e4de; margin-top: 10px; word-break: break-all;">
                  <a href="http://localhost:5173/?token=${token}" style="color: #C05640; font-size: 13px; text-decoration: none;">http://localhost:5173/?token=${token}</a>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #a39996; margin-top: 30px;">
                  Si tú no solicitaste este cambio, por favor ignora este correo y tu contraseña seguirá siendo la misma.
                </p>
              </div>
              <div style="background-color: #fcfbfa; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e4de;">
                <p style="margin: 0; color: #807471; font-size: 13px;">Saludos cordiales,<br/><strong>El equipo de Archivo de Folklore</strong></p>
              </div>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de recuperación enviado: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
    }
  }

  async sendCredentialsEmail(to, name, password) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Advertencia: Variables de entorno para Email no configuradas.');
        console.log(`\n🔑 [Credenciales] Contraseña para ${to}:\n${password}\n`);
        return;
      }

      const mailOptions = {
        from: `"Archivo Folklore" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Tus Credenciales de Acceso - Archivo Folklore',
        html: `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background-color: #fcfbfa; padding: 40px 20px; color: #281b18;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e8e4de;">
              <div style="background-color: #2c1e19; padding: 30px; text-align: center; border-bottom: 4px solid #C05640;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Archivo de Folklore</h1>
                <p style="color: #d1c9c7; margin: 8px 0 0 0; font-size: 11px; letter-spacing: 1.5px; font-weight: 700;">NUEVA CUENTA</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #281b18; margin-top: 0; font-size: 20px;">Hola ${name},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #807471;">
                  Se ha creado una nueva cuenta para ti en el sistema del <strong>Archivo de Folklore</strong>.
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #807471;">
                  A continuación, te proporcionamos tus credenciales de acceso. Te recomendamos cambiar tu contraseña una vez hayas iniciado sesión por primera vez.
                </p>
                
                <div style="background-color: #f7efe8; padding: 20px; border-radius: 8px; border: 1px dashed #C05640; margin: 30px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #807471;"><strong>Usuario / Correo:</strong> ${to}</p>
                  <p style="margin: 0; font-size: 14px; color: #807471;"><strong>Contraseña:</strong> <span style="font-family: monospace; font-size: 16px; color: #281b18; font-weight: bold;">${password}</span></p>
                </div>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="http://localhost:5173" style="display: inline-block; padding: 14px 28px; background-color: #C05640; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(192, 86, 64, 0.2);">Acceder al Sistema</a>
                </div>
              </div>
              <div style="background-color: #fcfbfa; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e4de;">
                <p style="margin: 0; color: #807471; font-size: 13px;">Saludos cordiales,<br/><strong>El equipo de Archivo de Folklore</strong></p>
              </div>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de credenciales enviado: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar email de credenciales:', error);
    }
  }
}

module.exports = new EmailService();
