const { Obras, Multimedia, Cultores, CategoriasObra, Notificaciones } = require('../models');
const Sequelize = require('sequelize');

const ESTATUS_VALIDOS = ['pendiente', 'aprobado', 'rechazado', 'eliminado'];
const { Op } = require('sequelize');

// Listar todos los registros (uso administrativo, requireAuth)
// Si el usuario es Administrador: devuelve todo con filtros opcionales.
// Si el usuario es Cultor: devuelve solo sus propias obras (todas, incluidas pendientes y rechazadas).
exports.list = exports.getAll = async (req, res, next) => {
  try {
    const { estatus } = req.query;
    const isAdministrador = req.auth?.rol?.toLowerCase() === 'administrador';
    const where = {};

    if (isAdministrador) {
      // Admin puede filtrar por estatus o ver todo excepto 'eliminado'
      if (estatus) {
        if (!ESTATUS_VALIDOS.includes(estatus)) {
          return res.status(400).json({ error: `estatus inválido. Use uno de: ${ESTATUS_VALIDOS.join(', ')}` });
        }
        where.estatus = estatus;
      } else {
        where.estatus = { [Op.ne]: 'eliminado' };
      }
    } else {
      // Cultor: solo sus propias obras — buscamos su id_cultor desde la BD
      const cultorRecord = await Cultores.findOne({
        where: { id_usuario: req.auth.id_usuario },
        attributes: ['id_cultor'],
      });
      if (!cultorRecord) {
        return res.json([]); // Sin cultor vinculado, devuelve lista vacía
      }
      where.id_cultor = cultorRecord.id_cultor;
      where.estatus = { [Op.ne]: 'eliminado' };
    }

    const items = await Obras.findAll({
      where,
      include: [
        { model: Multimedia, as: 'multimedia' },
        { model: Cultores, as: 'cultor' },
        { model: CategoriasObra, as: 'categoria' }
      ]
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getPublico = async (req, res, next) => {
  try {
    const where = { estatus: 'aprobado' };
    if (req.query.cultor_id) {
      where.id_cultor = parseInt(req.query.cultor_id, 10);
    }
    const items = await Obras.findAll({
      where,
      attributes: { exclude: ['observaciones_admin'] },
      include: [
        { model: Multimedia, as: 'multimedia' },
        { model: Cultores, as: 'cultor' }
      ]
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Obtener un registro por ID
exports.get = exports.getById = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra || req.params.id, {
      include: [
        { model: Multimedia, as: 'multimedia' },
        { model: Cultores, as: 'cultor' },
        { model: CategoriasObra, as: 'categoria' }
      ]
    });
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
// El código de inventario (IP-XXX) se asigna SOLO si la obra entra directamente como 'aprobado'
// (creación por el Administrador). Las postulaciones del cultor quedan sin código hasta ser aprobadas.
exports.create = async (req, res, next) => {
  try {
    const isAdministrador = req.auth?.rol?.toLowerCase() === 'administrador';
    const estatusInicial = isAdministrador ? 'aprobado' : 'pendiente';

    // Solo asignamos código si la obra entra aprobada directamente
    let codigoAsignado = null;
    if (estatusInicial === 'aprobado') {
      const allPieces = await Obras.findAll({ attributes: ['codigo_qr_link'] });
      let maxNum = 0;
      allPieces.forEach(p => {
        if (p.codigo_qr_link && p.codigo_qr_link.toUpperCase().startsWith('IP-')) {
          const num = parseInt(p.codigo_qr_link.toUpperCase().replace('IP-', ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      codigoAsignado = `IP-${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Si es un cultor (no admin), buscamos su id_cultor en la BD a partir del id_usuario
    // para que no tenga que enviarlo en el body (y evitar que suplante a otro).
    let id_cultor = req.body.id_cultor;
    if (!isAdministrador) {
      const cultorRecord = await Cultores.findOne({
        where: { id_usuario: req.auth.id_usuario },
        attributes: ['id_cultor'],
      });
      if (!cultorRecord) {
        return res.status(403).json({ error: 'Tu cuenta no está vinculada a un cultor registrado.' });
      }
      id_cultor = cultorRecord.id_cultor;
    }

    // Extraer solo los campos seguros del body (ignorar campos no permitidos del schema)
    const {
      titulo,
      tipo_patrimonio,
      descripcion_historica,
      materiales_utilizados,
      tecnica_utilizada,
      significado_cultural,
      dimensiones,
      peso,
      tiempo_ejecucion,
      estado_conservacion,
      ubicacion_actual,
      valor_estimado,
      id_categoria,
      id_parroquia,
    } = req.body;

    const item = await Obras.create({
      titulo,
      tipo_patrimonio,
      descripcion_historica,
      materiales_utilizados,
      tecnica_utilizada,
      significado_cultural,
      dimensiones,
      peso,
      tiempo_ejecucion,
      estado_conservacion,
      ubicacion_actual,
      valor_estimado,
      id_categoria,
      id_parroquia,
      id_cultor,
      codigo_qr_link: codigoAsignado,
      id_usuario_registro: req.auth?.id_usuario ?? null,
      fecha_postulacion: new Date(),
      estatus: estatusInicial,
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
// Al cambiar el estatus crea automáticamente una notificación en la cuenta del cultor autor de la obra.
exports.updateEstatus = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }
    const nuevoEstatus = req.body.estatus;
    const fechaAprobacion = nuevoEstatus === 'aprobado' ? new Date() : item.fecha_aprobacion;
    await item.update({ estatus: nuevoEstatus, fecha_aprobacion: fechaAprobacion });

    // Crear notificación para el cultor autor de la obra
    try {
      if (item.id_cultor) {
        const cultor = await Cultores.findByPk(item.id_cultor, {
          attributes: ['id_usuario', 'primer_nombre', 'primer_apellido'],
        });

        if (cultor?.id_usuario) {
          const tituloObra = item.titulo || 'tu obra';
          let tituloNotif, mensajeNotif, tipoNotif;

          if (nuevoEstatus === 'aprobado') {
            tituloNotif = '✅ Obra aprobada';
            mensajeNotif = `Tu obra "${tituloObra}" ha sido revisada y aprobada por el equipo del Archivo de Folklore del Táchira. Ya puede ser visualizada en la galería pública.`;
            tipoNotif = 'success';
          } else if (nuevoEstatus === 'rechazado') {
            tituloNotif = '❌ Obra no aprobada';
            mensajeNotif = `Tu obra "${tituloObra}" no pudo ser incorporada al inventario en esta ocasión. Si tienes dudas, comunícate con el administrador.`;
            tipoNotif = 'warning';
          }

          if (tituloNotif) {
            await Notificaciones.create({
              id_usuario: cultor.id_usuario,
              titulo: tituloNotif,
              mensaje: mensajeNotif,
              tipo: tipoNotif,
              leida: false,
            });
          }
        }
      }
    } catch (notifErr) {
      // No fallamos la respuesta principal si la notificación no se pudo crear
      console.error('[updateEstatus] No se pudo crear la notificación:', notifErr.message);
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro (Eliminación Física de la BD)
exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }

    const { Multimedia, ExposicionObras } = require('../models');

    // 1. Eliminar multimedia asociada
    await Multimedia.destroy({ where: { id_obra: item.id_obra } });

    // 2. Eliminar relaciones con exposiciones
    await ExposicionObras.destroy({ where: { id_obra: item.id_obra } });

    // 3. Eliminar la obra de la BD
    await item.destroy();

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro previa verificación de contraseña del administrador
exports.deleteWithPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Debes proporcionar tu contraseña para eliminar la obra.' });
    }

    // Verificar la contraseña del usuario autenticado
    const { verifyPassword } = require('../services/passwordService');
    const user = await require('../models').Usuarios.findByPk(req.auth.id_usuario);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(403).json({ error: 'La contraseña ingresada es incorrecta.' });
    }

    const item = await Obras.findByPk(req.params.id_obra || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }

    const { Multimedia, ExposicionObras } = require('../models');

    // 1. Eliminar multimedia asociada
    await Multimedia.destroy({ where: { id_obra: item.id_obra } });

    // 2. Eliminar relaciones con exposiciones
    await ExposicionObras.destroy({ where: { id_obra: item.id_obra } });

    // 3. Eliminar la obra de la BD
    await item.destroy();

    res.status(200).json({ message: 'Obra eliminada exitosamente' });
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
