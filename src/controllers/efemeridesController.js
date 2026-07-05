const { Efemerides } = require('../models');
const { subirBuffer } = require('../services/cloudinaryService');

// Listado administrativo completo (requireAuth), ordenado por mes/día.
exports.getAll = async (req, res, next) => {
  try {
    const items = await Efemerides.findAll({
      order: [['mes', 'ASC'], ['dia', 'ASC']],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Listado público (sin auth): SOLO las activas. Cuando no hay ninguna, la web
// oculta la sección completa de Efemérides sin mostrar mensaje.
exports.getPublicas = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const items = await Efemerides.findAll({
      where: { activa: true },
      order: [['mes', 'ASC'], ['dia', 'ASC']],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await Efemerides.findByPk(req.params.id_efemeride);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en efemerides' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      id_usuario_registro: req.auth?.id_usuario || null,
      fecha_registro: new Date(),
    };

    if (req.file) {
      const subida = await subirBuffer(req.file.buffer, {
        folder: 'archivo-tachira/efemerides',
        publicId: `efemeride_${Date.now()}`,
      });
      data.imagen = subida.secure_url;
    }

    const item = await Efemerides.create(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Efemerides.findByPk(req.params.id_efemeride);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en efemerides' });
    }

    const data = { ...req.body };

    if (req.file) {
      const subida = await subirBuffer(req.file.buffer, {
        folder: 'archivo-tachira/efemerides',
        publicId: `efemeride_${Date.now()}`,
      });
      data.imagen = subida.secure_url;
    }

    await item.update(data);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await Efemerides.findByPk(req.params.id_efemeride);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en efemerides' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
