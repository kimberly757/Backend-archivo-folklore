const crypto = require('crypto');
const { Usuarios, Roles } = require('../models');
const { hashPassword, verifyPassword, passwordFueUsadaAntes, agregarAlHistorial } = require('../services/passwordService');
const { signAccessToken } = require('../services/jwtService');

const register = async (req, res, next) => {
  try {
    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, password, id_rol, telefono } = req.body;

    if (!correo || !password || !primer_nombre || !primer_apellido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Determinar id_rol
    let activeIdRol = id_rol;
    if (!activeIdRol) {
      const roleObj = await Roles.findOne({ where: { nombre_rol: 'usuario' } });
      if (roleObj) {
        activeIdRol = roleObj.id_rol;
      }
    }

    // Único por (correo, id_rol): la misma persona puede tener cuentas con distinto rol.
    const existingUser = await Usuarios.findOne({ where: { correo, id_rol: activeIdRol || null } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const password_hash = await hashPassword(password);

    const newUser = await Usuarios.create({
      primer_nombre,
      segundo_nombre: segundo_nombre || null,
      primer_apellido,
      segundo_apellido: segundo_apellido || null,
      correo,
      password_hash,
      id_rol: activeIdRol || null,
      telefono: telefono || null,
      activo: true,
      fecha_registro: new Date(),
    });

    const userWithRole = await Usuarios.findByPk(newUser.id_usuario, {
      include: [{ model: Roles, as: 'rolRel' }]
    });

    const plainUser = userWithRole.get({ plain: true });
    delete plainUser.password_hash;

    // El correo de bienvenida ya no lo envía el backend (migrado a EmailJS en el
    // frontend). El frontend ya tiene en `user.correo`/`user.primer_nombre` todo
    // lo necesario para disparar la plantilla correspondiente tras recibir esta respuesta.

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: plainUser,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { correo, password, portal } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // El mismo correo puede pertenecer a más de una cuenta (una de administrador y
    // otra de cultor, por ejemplo), ya que la restricción de unicidad ahora es
    // (correo, id_rol). "portal" indica desde qué app se está iniciando sesión, para
    // elegir la cuenta correcta: el sitio público ('publico') solo autentica cultores,
    // el panel administrativo ('admin') autentica cualquier rol que no sea cultor.
    const candidatos = await Usuarios.findAll({
      where: { correo },
      include: [{ model: Roles, as: 'rolRel' }]
    });

    let user = null;
    if (portal === 'publico') {
      user = candidatos.find((u) => u.rolRel?.nombre_rol?.toLowerCase() === 'cultor') || null;
    } else if (portal === 'admin') {
      user = candidatos.find((u) => u.rolRel?.nombre_rol?.toLowerCase() !== 'cultor') || null;
    } else {
      user = candidatos[0] || null;
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return res.status(401).json({ error: 'Su usuario está inactivo. Por favor, contacte a la administración del archivo para reactivarlo.' });
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar la fecha de último acceso
    await user.update({ ultimo_acceso: new Date() });

    const plainUser = user.get({ plain: true });
    delete plainUser.password_hash;

    const token = signAccessToken({
      id_usuario: plainUser.id_usuario,
      correo: plainUser.correo,
      rol: user.rolRel ? user.rolRel.nombre_rol : 'usuario',
    });

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: plainUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { verifyAccessToken } = require('../services/jwtService');
    const decoded = verifyAccessToken(token);
    res.status(200).json({ message: 'Token válido', user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { correo } = req.body;
    const user = await Usuarios.findOne({ where: { correo } });
    if (!user) {
      return res.status(200).json({
        message: 'Si el correo está registrado, se generará una nueva contraseña temporal.'
      });
    }

    // Sin plantilla de correo disponible (límite del plan gratuito de EmailJS): en vez
    // de un token de un solo uso, se genera la contraseña definitiva de una vez y se
    // devuelve en esta respuesta para que el frontend la muestre en pantalla.
    //
    // ADVERTENCIA DE SEGURIDAD: esto es más sensible que el flujo anterior con token.
    // Cualquiera que conozca un correo registrado puede llamar este endpoint público
    // y CAMBIAR la contraseña de esa cuenta de inmediato (bloqueando al dueño real),
    // recibiendo la nueva clave en la respuesta. No hay rate-limiting ni verificación
    // de identidad. Aceptable solo para esta demo controlada; antes de producción
    // hay que agregar al menos límite de intentos por IP/correo.
    const passwordTemporal = crypto.randomBytes(9).toString('base64url');
    const password_hash = await hashPassword(passwordTemporal);
    await user.update({ password_hash, password_temporal: true });

    res.status(200).json({
      message: 'Contraseña temporal generada exitosamente.',
      passwordTemporal,
      nombre: `${user.primer_nombre} ${user.primer_apellido}`,
    });
  } catch (error) {
    next(error);
  }
};

// Solicitud de recuperación con token real persistido en BD + enlace por correo
// (vía EmailJS desde el frontend). Reemplaza al flujo de forgotPassword (que generaba
// la contraseña directamente porque entonces no había plantilla de correo disponible).
const olvidePassword = async (req, res, next) => {
  try {
    const { correo, portal } = req.body;

    // Mismo criterio de selección que login(): el correo puede pertenecer a una
    // cuenta de cultor y otra de administrador a la vez, así que hay que elegir la
    // correcta según el portal — si no, se le podía cambiar la contraseña a la
    // cuenta equivocada sin que nadie lo notara.
    const candidatos = await Usuarios.findAll({
      where: { correo },
      include: [{ model: Roles, as: 'rolRel' }],
    });

    let user = null;
    if (portal === 'publico') {
      user = candidatos.find((u) => u.rolRel?.nombre_rol?.toLowerCase() === 'cultor') || null;
    } else if (portal === 'admin') {
      user = candidatos.find((u) => u.rolRel?.nombre_rol?.toLowerCase() !== 'cultor') || null;
    } else {
      user = candidatos[0] || null;
    }

    const mensajeGenerico = 'Si el correo está registrado, recibirás un enlace de recuperación.';
    if (!user) {
      // Mismo mensaje exista o no la cuenta, para no filtrar qué correos están registrados.
      return res.status(200).json({ message: mensajeGenerico });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetExpires,
    });

    // ADVERTENCIA DE SEGURIDAD: el token viaja en esta respuesta porque el correo se
    // envía desde el frontend (EmailJS), no desde el servidor. A diferencia del token
    // JWT que se usaba antes, este SÍ queda invalidado en BD tras usarse una vez
    // (ver resetPassword) y expira al cabo de 1 hora aunque nunca se use.
    res.status(200).json({
      message: mensajeGenerico,
      resetToken,
      nombre: `${user.primer_nombre} ${user.primer_apellido}`,
    });
  } catch (error) {
    next(error);
  }
};

// Confirma el restablecimiento: valida el token contra BD (existencia + expiración),
// actualiza la contraseña y limpia el token para que no pueda reutilizarse.
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const user = await Usuarios.findOne({ where: { reset_password_token: token } });
    if (!user) {
      // No queda registro de este token en BD: o ya se usó para restablecer la
      // contraseña una vez (se limpia tras usarse), o se pidió un enlace más nuevo
      // que lo reemplazó (solo se guarda un token vigente por cuenta a la vez). No
      // se puede distinguir cuál de los dos pasó, así que el mensaje cubre ambos.
      return res.status(400).json({
        error: 'Este enlace de recuperación ya no es válido: puede haberse usado antes, haber expirado, o haberse generado uno más reciente. Solicita un enlace nuevo.',
      });
    }

    if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
      return res.status(400).json({ error: 'El token de recuperación expiró. Solicita uno nuevo.' });
    }

    const yaFueUsada = await passwordFueUsadaAntes(newPassword, user.password_hash, user.historial_passwords);
    if (yaFueUsada) {
      return res.status(400).json({ error: 'No puedes usar una contraseña que ya utilizaste anteriormente.' });
    }

    const new_password_hash = await hashPassword(newPassword);
    await user.update({
      password_hash: new_password_hash,
      password_temporal: false,
      historial_passwords: agregarAlHistorial(user.historial_passwords, user.password_hash),
      reset_password_token: null,
      reset_password_expires: null,
    });

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id_usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const user = await Usuarios.findByPk(req.auth.id_usuario, {
      include: [{ model: Roles, as: 'rolRel' }]
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const plainUser = user.get({ plain: true });
    delete plainUser.password_hash;

    res.status(200).json(plainUser);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id_usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo } = req.body;
    const user = await Usuarios.findByPk(req.auth.id_usuario);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (correo && correo !== user.correo) {
      // Límite de un cambio de correo por mes, contado desde el último cambio.
      if (user.correo_actualizado_en) {
        const proximoCambioPermitido = new Date(user.correo_actualizado_en.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (proximoCambioPermitido > new Date()) {
          return res.status(400).json({
            error: `Solo puedes cambiar tu correo una vez al mes. Podrás volver a hacerlo el ${proximoCambioPermitido.toLocaleDateString('es-VE')}.`,
          });
        }
      }

      // Único por (correo, id_rol): otro usuario con el mismo correo pero distinto
      // rol (ej. un cultor) no bloquea el cambio.
      const existingUser = await Usuarios.findOne({ where: { correo, id_rol: user.id_rol } });
      if (existingUser) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
      }
      user.correo = correo;
      user.correo_actualizado_en = new Date();
    }

    if (primer_nombre) user.primer_nombre = primer_nombre;
    if (segundo_nombre !== undefined) user.segundo_nombre = segundo_nombre;
    if (primer_apellido) user.primer_apellido = primer_apellido;
    if (segundo_apellido !== undefined) user.segundo_apellido = segundo_apellido;
    if (telefono !== undefined) user.telefono = telefono;

    await user.save();

    const userWithRole = await Usuarios.findByPk(user.id_usuario, {
      include: [{ model: Roles, as: 'rolRel' }]
    });

    const plainUser = userWithRole.get({ plain: true });
    delete plainUser.password_hash;

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: plainUser
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id_usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await Usuarios.findByPk(req.auth.id_usuario);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    const yaFueUsada = await passwordFueUsadaAntes(newPassword, user.password_hash, user.historial_passwords);
    if (yaFueUsada) {
      return res.status(400).json({ error: 'No puedes usar una contraseña que ya utilizaste anteriormente.' });
    }

    const new_password_hash = await hashPassword(newPassword);
    await user.update({
      password_hash: new_password_hash,
      password_temporal: false,
      historial_passwords: agregarAlHistorial(user.historial_passwords, user.password_hash),
    });

    res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  forgotPassword,
  olvidePassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
};

const verifyPasswordOnly = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id_usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Debe proporcionar la contraseña' });
    }

    const user = await Usuarios.findByPk(req.auth.id_usuario);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    res.json({ valida: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  forgotPassword,
  olvidePassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  verifyPasswordOnly,
};
