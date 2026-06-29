const { Obras } = require('../models');

const ESTATUS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'];

// Listar todos los registros (uso administrativo, requireAuth)
// Admite ?estatus=pendiente|aprobado|rechazado para filtrar; sin el query param, devuelve todo.
exports.list = exports.getAll = async (req, res, next) => {
  try {
    const { estatus } = req.query;
    const where = {};
    if (estatus) {
      if (!ESTATUS_VALIDOS.includes(estatus)) {
        return res.status(400).json({ error: `estatus inválido. Use uno de: ${ESTATUS_VALIDOS.join(', ')}` });
      }
      where.estatus = estatus;
    }
    const items = await Obras.findAll({ where });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Listado público (sin auth): SIEMPRE fuerza estatus = 'aprobado' en el servidor,
// sin importar lo que el cliente intente mandar por query string. Oculta notas internas.
exports.getPublico = async (req, res, next) => {
  try {
    const items = await Obras.findAll({
      where: { estatus: 'aprobado' },
      attributes: { exclude: ['observaciones_admin'] },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Obtener un registro por ID
exports.get = exports.getById = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Crear un registro (postulación). estatus/observaciones_admin/fecha_aprobacion
// e id_usuario_registro NUNCA vienen del body: el esquema de validación ya los excluye,
// y aquí se fija explícitamente quién registra y cuándo se postuló.
exports.create = async (req, res, next) => {
  try {
    const item = await Obras.create({
      ...req.body,
      id_usuario_registro: req.auth?.id_usuario ?? null,
      fecha_postulacion: new Date(),
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// Actualizar un registro
exports.update = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Cambiar el estatus (aprobar/rechazar). Acción dedicada y auditable, separada del PUT genérico.
exports.updateEstatus = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }
    const fechaAprobacion = req.body.estatus === 'aprobado' ? new Date() : item.fecha_aprobacion;
    await item.update({ estatus: req.body.estatus, fecha_aprobacion: fechaAprobacion });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro
exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Actualizar el campo destacado_galeria
exports.updateDestacado = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra);
    if (!item) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    const { destacado_galeria } = req.body;
    await item.update({ destacado_galeria });
    res.json(item);
  } catch (err) {
    next(err);
  }
};
