const { Salas, Obras, Multimedia, Cultores, Sequelize } = require('../models');
const { Op } = require('sequelize');

const TIPO_PREFIX = { 'Exhibición': 'EXH', 'Almacén': 'ALM', 'Taller': 'TLL' };

async function generarCodigo(tipo) {
  const prefix = TIPO_PREFIX[tipo] || 'EXH';
  const lastSala = await Salas.findOne({
    where: { tipo },
    order: [['id_sala', 'DESC']],
    attributes: ['codigo'],
    raw: true,
  });
  let nextNum = 1;
  if (lastSala && lastSala.codigo) {
    const match = lastSala.codigo.match(/-(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

function mapTipoFromUbicacion(ubicacion) {
  const u = (ubicacion || '').toLowerCase();
  if (u.includes('depósito') || u.includes('deposito') || u.includes('almacén') || u.includes('almacen')) return 'Almacén';
  if (u.includes('taller')) return 'Taller';
  return 'Exhibición';
}

async function autoSeedFromObras() {
  const count = await Salas.count();
  if (count > 0) return;
  const ubicaciones = await Obras.findAll({
    attributes: ['ubicacion_actual'],
      where: { ubicacion_actual: { [Op.ne]: null } },
    group: ['ubicacion_actual'],
    raw: true,
  });
  const names = [...new Set(ubicaciones.map(r => r.ubicacion_actual))];
  for (const name of names) {
    const tipo = mapTipoFromUbicacion(name);
    const existing = await Salas.findOne({ where: { nombre: name } });
    if (!existing) {
      const codigo = await generarCodigo(tipo);
      await Salas.create({ codigo, nombre: name, tipo, estado: 'Habilitada' });
    }
  }
  if (names.length > 0) {
    console.log(`🏛️  Salas auto-sembradas desde obras existentes: ${names.length} salas creadas.`);
  }
}

exports.list = exports.getAll = async (req, res, next) => {
  try {
    await autoSeedFromObras();
    const items = await Salas.findAll({ order: [['codigo', 'ASC']] });
    const result = await Promise.all(items.map(async (sala) => {
      const count = await Obras.count({
        where: { ubicacion_actual: sala.nombre },
      });
      return { ...sala.toJSON(), cantidad_obras: count };
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const sala = await Salas.findByPk(req.params.id_sala);
    if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
    const count = await Obras.count({
      where: { ubicacion_actual: sala.nombre },
    });
    res.json({ ...sala.toJSON(), cantidad_obras: count });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const tipo = req.body.tipo || 'Exhibición';
    const codigo = req.body.codigo && req.body.codigo.trim() ? req.body.codigo.trim() : await generarCodigo(tipo);
    const item = await Salas.create({ ...req.body, codigo });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Salas.findByPk(req.params.id_sala);
    if (!item) return res.status(404).json({ error: 'Sala no encontrada' });
    const oldNombre = item.nombre;
    await item.update(req.body);
    if (req.body.nombre && req.body.nombre !== oldNombre) {
      await Obras.update(
        { ubicacion_actual: req.body.nombre },
        { where: { ubicacion_actual: oldNombre } }
      );
    }
    const count = await Obras.count({
      where: { ubicacion_actual: item.nombre },
    });
    res.json({ ...item.toJSON(), cantidad_obras: count });
  } catch (err) {
    next(err);
  }
};

exports.cambiarEstado = async (req, res, next) => {
  try {
    const sala = await Salas.findByPk(req.params.id_sala);
    if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });

    const { estado, moverA } = req.body;
    if (!estado) return res.status(400).json({ error: 'El campo estado es requerido' });

    if (estado === 'Deshabilitada') {
      const count = await Obras.count({ where: { ubicacion_actual: sala.nombre } });
      if (count > 0) {
        if (moverA) {
          const target = await Salas.findByPk(moverA);
          if (!target) return res.status(404).json({ error: 'Sala de destino no encontrada' });
          if (Number(moverA) === Number(req.params.id_sala)) {
            return res.status(400).json({ error: 'No puedes mover las obras a la misma sala' });
          }
          await Obras.update(
            { ubicacion_actual: target.nombre },
            { where: { ubicacion_actual: sala.nombre } }
          );
        } else {
          return res.status(400).json({
            error: `La sala tiene ${count} obra(s). Debes indicar una sala de destino (moverA) para trasladarlas antes de deshabilitarla.`,
          });
        }
      }
    }

    sala.estado = estado;
    await sala.save();

    const count = await Obras.count({ where: { ubicacion_actual: sala.nombre } });
    res.json({ ...sala.toJSON(), cantidad_obras: count });
  } catch (err) {
    next(err);
  }
};

exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await Salas.findByPk(req.params.id_sala);
    if (!item) return res.status(404).json({ error: 'Sala no encontrada' });
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.getObrasPorSala = async (req, res, next) => {
  try {
    const sala = await Salas.findByPk(req.params.id_sala);
    if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });

    const obras = await Obras.findAll({
      where: { ubicacion_actual: sala.nombre },
      include: [
        {
          model: Cultores,
          as: 'cultor',
          attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'],
        },
        {
          model: Multimedia,
          as: 'multimedia',
          where: { es_portada: 'si' },
          required: false,
          attributes: ['url_archivo', 'tipo_archivo'],
        },
      ],
      order: [['titulo', 'ASC']],
    });

    const result = obras.map(obra => ({
      id_obra: obra.id_obra,
      titulo: obra.titulo,
      codigo_inventario: obra.codigo_qr_link,
      autor: obra.cultor
        ? [obra.cultor.primer_nombre, obra.cultor.segundo_nombre, obra.cultor.primer_apellido, obra.cultor.segundo_apellido]
            .filter(Boolean).join(' ')
        : 'Desconocido',
      imagen: obra.multimedia && obra.multimedia.length > 0 ? obra.multimedia[0].url_archivo : null,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};
