const { Obras, Multimedia, Cultores, CategoriasObra, Notificaciones, Usuarios, Roles, sequelize } = require('../models');
const Sequelize = require('sequelize');
const { getIO } = require('../services/socketManager');
const { subirBuffer } = require('../services/cloudinaryService');

const ESTATUS_VALIDOS = ['pendiente', 'aprobado', 'rechazado', 'eliminado'];
const { Op } = require('sequelize');

// Calcula el siguiente código de inventario (IP-XXX) disponible. Usado tanto al crear
// una obra ya aprobada como al aprobar una que estaba pendiente y no tenía código aún.
async function generarSiguienteCodigo() {
  const allPieces = await Obras.findAll({ attributes: ['codigo_qr_link'] });
  let maxNum = 0;
  allPieces.forEach(p => {
    if (p.codigo_qr_link && p.codigo_qr_link.toUpperCase().startsWith('IP-')) {
      const num = parseInt(p.codigo_qr_link.toUpperCase().replace('IP-', ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  return `IP-${String(maxNum + 1).padStart(3, '0')}`;
}

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

    // La foto es obligatoria cuando el propio cultor postula su obra — sin imagen no
    // tiene sentido enviarla. El admin puede seguir creando obras sin foto desde el
    // panel (Inventario Patrimonial), como ya podía.
    if (!isAdministrador && !req.file) {
      return res.status(400).json({ error: 'Debes adjuntar una fotografía de la obra para completar el registro.' });
    }

    // Solo asignamos código si la obra entra aprobada directamente
    let codigoAsignado = null;
    if (estatusInicial === 'aprobado') {
      codigoAsignado = await generarSiguienteCodigo();
    }

    // Si es un cultor (no admin), buscamos su id_cultor e id_parroquia en la BD a partir
    // del id_usuario para que no tenga que enviarlos en el body (y evitar que suplante a
    // otro cultor o postule con una parroquia distinta a la suya). La web pública nunca
    // manda id_parroquia — antes eso dejaba la obra sin parroquia asignada.
    let id_cultor = req.body.id_cultor;
    let id_parroquia = req.body.id_parroquia;
    if (!isAdministrador) {
      const cultorRecord = await Cultores.findOne({
        where: { id_usuario: req.auth.id_usuario },
        attributes: ['id_cultor', 'id_parroquia'],
      });
      if (!cultorRecord) {
        return res.status(403).json({ error: 'Tu cuenta no está vinculada a un cultor registrado.' });
      }
      id_cultor = cultorRecord.id_cultor;
      id_parroquia = cultorRecord.id_parroquia;
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
      anio_creacion,
      estado_conservacion,
      ubicacion_actual,
      valor_estimado,
      id_categoria,
    } = req.body;

    // La obra y su foto se crean en una sola transacción: si la imagen falla al
    // subir, se revierte la creación de la obra completa — nunca queda una obra
    // 'pendiente' huérfana sin fotografía (mismo patrón que la cédula del cultor).
    const item = await sequelize.transaction(async (t) => {
      const obra = await Obras.create({
        titulo,
        tipo_patrimonio,
        descripcion_historica,
        materiales_utilizados,
        tecnica_utilizada,
        significado_cultural,
        dimensiones,
        peso,
        tiempo_ejecucion,
        anio_creacion,
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
      }, { transaction: t });

      if (req.file) {
        let resultado;
        try {
          resultado = await subirBuffer(req.file.buffer, {
            folder: 'archivo-tachira/multimedia',
            publicId: `obra_${obra.id_obra}_${Date.now()}`,
          });
        } catch (e) {
          const err = new Error('No se pudo procesar la fotografía de la obra. Intenta nuevamente.');
          err.status = 422;
          throw err;
        }
        await Multimedia.create({
          tipo_archivo: 'imagen',
          url_archivo: resultado.secure_url,
          nombre_archivo: req.file.originalname,
          id_obra: obra.id_obra,
          es_portada: 'si',
          fecha_carga: new Date(),
          id_usuario_carga: req.auth?.id_usuario || null,
        }, { transaction: t });
      }

      return obra;
    });

    // Notificar al cultor que su obra fue recibida (solo cuando la postula él mismo,
    // no cuando el admin la registra directamente ya aprobada). Mismo patrón que
    // updateEstatus, sin hacer fallar la respuesta principal si la notificación falla.
    if (!isAdministrador) {
      try {
        await Notificaciones.create({
          id_usuario: req.auth.id_usuario,
          titulo: '📥 Obra recibida',
          mensaje: `Tu obra "${item.titulo}" fue recibida y está en revisión por el equipo del Archivo de Folklore del Táchira.`,
          tipo: 'info',
          leida: false,
        });
      } catch (notifErr) {
        console.error('[obras.create] No se pudo crear la notificación:', notifErr.message);
      }
    }

    res.status(201).json(item);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

// Notifica a todos los administradores activos. Usado cuando un cultor edita una obra
// ya aprobada y esta vuelve a 'pendiente' para que el equipo del museo la revise de nuevo.
async function notificarAdministradores(titulo, mensaje, tipo = 'info') {
  const rolAdmin = await Roles.findOne({
    where: sequelize.where(sequelize.fn('lower', sequelize.col('nombre_rol')), 'administrador'),
  });
  if (!rolAdmin) return;

  // Sin filtrar por "activo": esa columna permite NULL y no tiene default, así que
  // exigir activo:true dejaba fuera a cuentas admin legítimas cuyo valor nunca se fijó.
  const admins = await Usuarios.findAll({
    where: { id_rol: rolAdmin.id_rol },
    attributes: ['id_usuario'],
  });
  if (admins.length === 0) return;

  await Notificaciones.bulkCreate(admins.map((admin) => ({
    id_usuario: admin.id_usuario,
    titulo,
    mensaje,
    tipo,
    leida: false,
  })));
}

// Actualizar un registro. El admin puede editar todo (panel Inventario Patrimonial).
// El cultor solo puede editar el contenido de su propia obra (requireOwnObraOrAdmin ya
// validó que es el dueño) — no la categoría, que queda a criterio del museo — y si la
// obra ya estaba aprobada, editar su contenido la regresa a 'pendiente' para que el
// equipo del museo la revise de nuevo antes de que el cambio se vea reflejado al público.
exports.update = async (req, res, next) => {
  try {
    const item = await Obras.findByPk(req.params.id_obra || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }

    const isAdministrador = req.auth?.rol?.toLowerCase() === 'administrador';
    const datosActualizar = { ...req.body };

    let volvioAPendiente = false;
    if (!isAdministrador) {
      delete datosActualizar.id_categoria;
      // Tanto una obra ya aprobada como una rechazada vuelven a 'pendiente' al ser
      // editadas por su autor: la aprobada porque cambió y hay que revalidarla, la
      // rechazada porque el cultor la corrigió y merece una nueva revisión (si no,
      // quedaría rechazada para siempre sin forma de corregirse).
      if (item.estatus === 'aprobado' || item.estatus === 'rechazado') {
        datosActualizar.estatus = 'pendiente';
        volvioAPendiente = true;
      }
    }

    await item.update(datosActualizar);

    if (volvioAPendiente) {
      try {
        await notificarAdministradores(
          '✏️ Obra editada por el cultor',
          `La obra "${item.titulo}" fue modificada por su autor y volvió a estado "Pendiente" para revisión.`,
          'info'
        );
      } catch (notifErr) {
        console.error('[obras.update] No se pudo notificar a los administradores:', notifErr.message);
      }
    }

    try { getIO().emit('obra:updated', {}); } catch (_) {}
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
    const updateData = { estatus: nuevoEstatus, fecha_aprobacion: fechaAprobacion };
    if (req.body.ubicacion_actual !== undefined) {
      updateData.ubicacion_actual = req.body.ubicacion_actual;
    }
    // Una obra que empezó pendiente (postulada por el cultor) nunca recibió código de
    // inventario al crearse — se le asigna aquí, al aprobarla, si todavía no tiene uno.
    if (nuevoEstatus === 'aprobado' && !item.codigo_qr_link) {
      updateData.codigo_qr_link = await generarSiguienteCodigo();
    }
    await item.update(updateData);

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

    try { getIO().emit('obra:updated', {}); } catch (_) {}

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
    try { getIO().emit('obra:updated', {}); } catch (_) {}

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

// Reemplaza la fotografía de una obra ya existente (autoservicio del cultor sobre su
// propia obra, o admin). requireOwnObraOrAdmin ya validó que la obra pertenece a quien
// hace la petición (o que es admin) y dejó la obra en req.obra. Sustituye cualquier
// imagen anterior por la nueva, para que la galería siempre muestre la foto más reciente.
exports.reemplazarFoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes adjuntar una fotografía.' });
    }

    const obra = req.obra || await Obras.findByPk(req.params.id_obra);
    if (!obra) {
      return res.status(404).json({ error: 'Registro no encontrado en obras' });
    }

    const resultado = await subirBuffer(req.file.buffer, {
      folder: 'archivo-tachira/multimedia',
      publicId: `obra_${obra.id_obra}_${Date.now()}`,
    });

    await Multimedia.destroy({ where: { id_obra: obra.id_obra } });

    const nuevaImagen = await Multimedia.create({
      tipo_archivo: 'imagen',
      url_archivo: resultado.secure_url,
      nombre_archivo: req.file.originalname,
      id_obra: obra.id_obra,
      es_portada: 'si',
      fecha_carga: new Date(),
      id_usuario_carga: req.auth?.id_usuario || null,
    });

    try { getIO().emit('obra:updated', {}); } catch (_) {}

    res.status(201).json(nuevaImagen);
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