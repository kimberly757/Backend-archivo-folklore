const { FeDeVida, Cultores } = require('../models');

// Listar todos los registros
exports.list = exports.getAll = async (req, res, next) => {
  try {
    const items = await FeDeVida.findAll();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Obtener un registro por ID
exports.get = exports.getById = async (req, res, next) => {
  try {
    const item = await FeDeVida.findByPk(req.params.id_fe_de_vida || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en fe_de_vida' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Crear un registro y sincronizar estatus_vida del cultor
exports.create = async (req, res, next) => {
  try {
    const item = await FeDeVida.create(req.body);
    if (item.id_cultor && item.estatus_confirmado) {
      await Cultores.update(
        { estatus_vida: item.estatus_confirmado },
        { where: { id_cultor: item.id_cultor } },
      );
    }
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// Actualizar un registro y sincronizar estatus_vida del cultor
exports.update = async (req, res, next) => {
  try {
    const item = await FeDeVida.findByPk(req.params.id_fe_de_vida || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en fe_de_vida' });
    }
    await item.update(req.body);
    if (item.id_cultor && req.body.estatus_confirmado !== undefined) {
      await Cultores.update(
        { estatus_vida: req.body.estatus_confirmado || null },
        { where: { id_cultor: item.id_cultor } },
      );
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro
exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await FeDeVida.findByPk(req.params.id_fe_de_vida || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en fe_de_vida' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
