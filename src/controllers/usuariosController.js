const { Usuarios, Roles, Notificaciones } = require('../models');
const { hashPassword } = require('../services/passwordService');
const crypto = require('crypto');
const { getIO } = require('../services/socketManager');

// Listar todos los registros
exports.list = exports.getAll = async (req, res, next) => {
  try {
    const items = await Usuarios.findAll({
      include: [{ model: Roles, as: 'rolRel' }]
    });
    items.forEach(item => {
      if (item.password_hash) item.password_hash = undefined;
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Obtener un registro por ID
exports.get = exports.getById = async (req, res, next) => {
  try {
    const item = await Usuarios.findByPk(req.params.id_usuario || req.params.id, {
      include: [{ model: Roles, as: 'rolRel' }]
    });
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en usuarios' });
    }
    const plain = item.get({ plain: true });
    delete plain.password_hash;
    res.json(plain);
  } catch (err) {
    next(err);
  }
};

// Crear un registro
exports.create = async (req, res, next) => {
  try {
    let generatedPassword = null;

    if (!req.body.password) {
      generatedPassword = crypto.randomBytes(4).toString('hex') + 'X8$'; // e.g., "a1b2c3d4X8$"
      req.body.password = generatedPassword;
    }

    if (req.body.password) {
      req.body.password_hash = await hashPassword(req.body.password);
      delete req.body.password;
    }
    // Toda contraseña generada por el sistema (nunca elegida por la persona) queda
    // marcada como temporal, para forzar el recordatorio de cambio al iniciar sesión.
    req.body.password_temporal = Boolean(generatedPassword);

    const item = await Usuarios.create(req.body);
    const itemWithRole = await Usuarios.findByPk(item.id_usuario, {
      include: [{ model: Roles, as: 'rolRel' }]
    });
    const plain = itemWithRole.get({ plain: true });
    delete plain.password_hash;

    // El correo de credenciales se migró a EmailJS en el frontend. Se devuelve la
    // contraseña autogenerada SOLO en esta respuesta puntual (nunca se persiste en
    // texto plano) para que el dashboard del admin dispare la plantilla y/o la
    // muestre en pantalla, como ya hace UsersManagement.jsx.
    if (generatedPassword) {
      plain.password_creada = generatedPassword;

      await Notificaciones.create({
        id_usuario: item.id_usuario,
        titulo: 'Cambia tu contraseña temporal',
        mensaje: 'Tu cuenta fue creada con una contraseña generada por el sistema. Por seguridad, cámbiala cuanto antes desde tu perfil.',
        tipo: 'alerta',
      });
    }

    res.status(201).json(plain);
  } catch (err) {
    next(err);
  }
};

// Actualizar un registro
exports.update = async (req, res, next) => {
  try {
    const item = await Usuarios.findByPk(req.params.id_usuario || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en usuarios' });
    }
    if (req.body.password) {
      req.body.password_hash = await hashPassword(req.body.password);
      delete req.body.password;
    }
    await item.update(req.body);
    const itemWithRole = await Usuarios.findByPk(item.id_usuario, {
      include: [{ model: Roles, as: 'rolRel' }]
    });
    const plain = itemWithRole.get({ plain: true });
    delete plain.password_hash;
    res.json(plain);
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro
exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await Usuarios.findByPk(req.params.id_usuario || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en usuarios' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Activar o desactivar un usuario (toggle activo)
exports.toggleActivo = async (req, res, next) => {
  try {
    const item = await Usuarios.findByPk(req.params.id_usuario || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en usuarios' });
    }
    const nuevoValor = !item.activo;
    await item.update({ activo: nuevoValor });
    try { getIO().emit('cultor:updated', {}); } catch (_) {}
    res.json({ activo: nuevoValor });
  } catch (err) {
    next(err);
  }
};
