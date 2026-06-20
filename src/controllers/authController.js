const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_default';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendWelcomeEmail = async (to, name) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Credenciales de email no configuradas. Saltando envío.');
      return;
    }
    const mailOptions = {
      from: `"Archivo Folklore" <${process.env.EMAIL_USER}>`,
      to,
      subject: '¡Bienvenido al Archivo Folklore!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hola ${name},</h2>
          <p>Gracias por registrarte. Tu cuenta ha sido creada exitosamente.</p>
          <br/>
          <p>Saludos,</p>
          <p>El equipo de Archivo Folklore</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
};

const register = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol, telefono } = req.body;

    if (!correo || !password || !nombre_completo) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const { rows: existingUsers } = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO usuarios (nombre_completo, correo, password_hash, rol, telefono, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_usuario, nombre_completo, correo, rol, activo
    `;
    const values = [nombre_completo, correo, password_hash, rol || 'usuario', telefono || null, true];
    
    const { rows } = await pool.query(insertQuery, values);
    const newUser = rows[0];

    // Enviar email
    sendWelcomeEmail(newUser.correo, newUser.nombre_completo);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const { rows } = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(401).json({ message: 'El usuario está inactivo' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = $1', [user.id_usuario]);

    const token = jwt.sign(
      { id_usuario: user.id_usuario, correo: user.correo, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    delete user.password_hash;

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ message: 'Token válido', user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = {
  register,
  login,
  verifyToken
};
