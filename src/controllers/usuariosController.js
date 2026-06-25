const { Usuarios, Roles } = require('../models');
const { hashPassword } = require('../services/passwordService');
const emailService = require('../services/emailService');
const crypto = require('crypto');

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
    const item = await Usuarios.create(req.body);
    const itemWithRole = await Usuarios.findByPk(item.id_usuario, {
      include: [{ model: Roles, as: 'rolRel' }]
    });
    const plain = itemWithRole.get({ plain: true });
    delete plain.password_hash;

    if (generatedPassword && plain.correo) {
      // Send email asynchronously without blocking the response heavily
      emailService.sendCredentialsEmail(plain.correo, plain.primer_nombre, generatedPassword).catch(console.error);
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
