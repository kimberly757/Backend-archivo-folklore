const crypto = require('crypto');
const { Cultores, Usuarios, Roles, Parroquias, Municipios, Notificaciones, FeDeVida, Oficios, DocumentosCultor, sequelize } = require('../models');
const { hashPassword } = require('../services/passwordService');
const { subirBuffer } = require('../services/cloudinaryService');
const { getIO } = require('../services/socketManager');
const { Readable } = require('stream');

const ESTATUS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'];

// Include reutilizable: parroquia + municipio + usuario (activo) + fe de vida más
// reciente (la más reciente se resuelve en el cliente, ordenando por fecha_control).
const INCLUDE_COMPLETO = [{
  model: Parroquias,
  as: 'parroquia',
  attributes: ['id_parroquia', 'nombre'],
  include: [{ model: Municipios, as: 'municipio', attributes: ['id_municipio', 'nombre'] }],
}, {
  model: Usuarios,
  as: 'usuario',
  attributes: ['activo'],
  required: false,
}, {
  model: FeDeVida,
  as: 'fesDeVida',
  required: false,
}, {
  model: DocumentosCultor,
  as: 'documentos',
  required: false,
}];

// Campos sensibles que la web pública nunca debe recibir. telefono_contacto y
// correo_contacto NO están aquí a propósito: se consultan igual, pero solo se
// devuelven en getPublico si el propio cultor activó mostrar_contacto_publico —
// ver el .map() de getPublico más abajo.
const CAMPOS_OCULTOS_PUBLICO = [
  'cedula',
  'direccion_residencia',
  'datos_censo_adicionales',
];

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const LABEL_ESTATUS_VIDA = {
  activo: 'Miembro Activo',
  honorario: 'Miembro Honorario',
};

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
    const items = await Cultores.findAll({
      where,
      include: INCLUDE_COMPLETO,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Perfil del cultor logueado (requireAuth, cualquier usuario autenticado): busca el
// registro de Cultores vinculado a su propia cuenta vía id_usuario. Es el endpoint que
// usa la web pública para mostrar datos reales en "Mi Perfil", nunca el de otro cultor.
exports.getMiPerfil = async (req, res, next) => {
  try {
    const cultor = await Cultores.findOne({
      where: { id_usuario: req.auth.id_usuario },
      include: [{
        model: Parroquias,
        as: 'parroquia',
        attributes: ['id_parroquia', 'nombre'],
        include: [{ model: Municipios, as: 'municipio', attributes: ['id_municipio', 'nombre'] }],
      }],
    });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }
    res.json(cultor);
  } catch (err) {
    next(err);
  }
};

// Listado público (sin auth) para el directorio de la web pública: solo devuelve
// cultores aprobados cuyo usuario vinculado esté activo, incluye oficio principal,
// ubicación y oculta campos sensibles.
exports.getPublico = async (req, res, next) => {
  try {
    const items = await Cultores.findAll({
      where: { estatus: 'aprobado' },
      attributes: { exclude: CAMPOS_OCULTOS_PUBLICO },
      include: [
        {
          model: Usuarios,
          as: 'usuario',
          attributes: ['activo'],
          where: { activo: true },
          required: true,
        },
        {
          model: Oficios,
          as: 'oficios',
          attributes: ['id_oficio', 'nombre'],
          through: { attributes: ['es_principal'] },
          required: false,
        },
        {
          model: Parroquias,
          as: 'parroquia',
          attributes: ['nombre'],
          include: [{ model: Municipios, as: 'municipio', attributes: ['nombre'] }],
          required: false,
        },
        {
          model: FeDeVida,
          as: 'fesDeVida',
          attributes: ['id_fe_vida', 'estatus_confirmado'],
          required: false,
        },
      ],
    });

    const resultado = items.map((cultor) => {
      const oficioPrincipal = cultor.oficios?.find((o) => o.CultorOficios?.es_principal === 'si')
        || cultor.oficios?.[0];
      const estatusVida = cultor.estatus_vida || (() => {
        const regs = cultor.fesDeVida || [];
        const ultimo = regs.length
          ? [...regs].sort((a, b) => (b.id_fe_vida || 0) - (a.id_fe_vida || 0))[0]
          : null;
        return ultimo?.estatus_confirmado || null;
      })();
      return {
        id: cultor.id_cultor,
        nombre_completo: [cultor.primer_nombre, cultor.segundo_nombre, cultor.primer_apellido, cultor.segundo_apellido]
          .filter(Boolean).join(' '),
        oficio: oficioPrincipal?.nombre || null,
        resumen_curricular: cultor.resumen_curricular,
        foto_perfil: cultor.foto_perfil,
        rol: LABEL_ESTATUS_VIDA[estatusVida] || null,
        municipio: cultor.parroquia?.municipio?.nombre || null,
        seudonimo: cultor.seudonimo || null,
        fecha_nacimiento: toDateOnly(cultor.fecha_nacimiento),
        genero: cultor.genero || null,
        trayectoria_documentada: cultor.trayectoria_documentada || null,
        esta_certificado: cultor.esta_certificado || false,
        // Solo se exponen si el propio cultor activó "mostrar mi contacto públicamente".
        telefono_contacto: cultor.mostrar_contacto_publico ? cultor.telefono_contacto : null,
        correo_contacto: cultor.mostrar_contacto_publico ? cultor.correo_contacto : null,
      };
    });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
};

// Obtener un registro por ID
exports.get = exports.getById = async (req, res, next) => {
  try {
    const item = await Cultores.findByPk(req.params.id_cultor || req.params.id, {
      include: INCLUDE_COMPLETO,
    });
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en cultores' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Crea los documentos de un cultor recién creado DENTRO de la misma transacción que lo
// creó: la cédula es obligatoria (si falta o su subida falla, se relanza el error para
// que la transacción completa haga rollback y el cultor NUNCA quede creado sin ella).
// Los documentos de soporte son opcionales de adjuntar, pero si el cultor adjuntó
// alguno, también deben guardarse todos correctamente o se revierte todo — no hay
// "mejor esfuerzo" a medias. Usada por create() (postulación pública) e
// ingresoManual() (alta directa del admin) para no duplicar esta lógica.
async function crearDocumentosDelCultor(idCultor, files, t) {
  const archivoCedula = files?.archivo_cedula?.[0];
  if (!archivoCedula) {
    const err = new Error('Debes adjuntar la foto o documento de tu cédula para completar el registro.');
    err.status = 400;
    throw err;
  }

  let resultadoCedula;
  try {
    resultadoCedula = await subirBuffer(archivoCedula.buffer, {
      folder: 'archivo-tachira/cedulas',
      publicId: `cultor_${idCultor}_${Date.now()}`,
    });
  } catch (e) {
    const err = new Error('No se pudo procesar el documento de cédula. Intenta nuevamente.');
    err.status = 422;
    throw err;
  }
  await DocumentosCultor.create({
    id_cultor: idCultor,
    tipo_documento: 'cedula',
    url_archivo: resultadoCedula.secure_url,
    nombre_archivo: archivoCedula.originalname,
    fecha_carga: new Date(),
  }, { transaction: t });

  const archivosSoporte = files?.archivos_soporte || [];
  for (let i = 0; i < archivosSoporte.length; i++) {
    const file = archivosSoporte[i];
    let resultado;
    try {
      resultado = await subirBuffer(file.buffer, {
        folder: 'archivo-tachira/documentos-soporte',
        publicId: `soporte_${idCultor}_${Date.now()}_${i}`,
      });
    } catch (e) {
      const err = new Error('No se pudo procesar uno de los documentos de soporte. Intenta nuevamente.');
      err.status = 422;
      throw err;
    }
    await DocumentosCultor.create({
      id_cultor: idCultor,
      tipo_documento: 'soporte',
      url_archivo: resultado.secure_url,
      nombre_archivo: file.originalname,
      fecha_carga: new Date(),
    }, { transaction: t });
  }
}

// Crear un registro (postulación). fecha_registro NUNCA viene del body: se fija aquí,
// mismo patrón que fecha_postulacion en obrasController.create. SIEMPRE queda
// 'pendiente' (el esquema de validación ni siquiera acepta 'estatus' del cliente) —
// esta es la ruta pública, sin auth; el auto-aprobado vive en ingresoManual.
// La cédula (y los soportes, si los adjuntó) se crean en la MISMA transacción que el
// cultor: si algún documento falla, TODO se revierte — nunca queda un cultor 'pendiente'
// sin su documento de identidad.
exports.create = async (req, res, next) => {
  try {
    const { cedula, correo_contacto, fecha_nacimiento } = req.body;

    if (!req.files?.archivo_cedula?.[0]) {
      return res.status(400).json({
        error: 'Debes adjuntar la foto o documento de tu cédula para completar el registro.',
      });
    }

    if (cedula) {
      const existeCedula = await Cultores.findOne({ where: { cedula } });
      if (existeCedula) {
        return res.status(409).json({
          error: 'La cédula ya se encuentra registrada en el sistema.',
          campo: 'cedula',
        });
      }
    }

    if (correo_contacto) {
      const existeCorreo = await Cultores.findOne({ where: { correo_contacto } });
      if (existeCorreo) {
        return res.status(409).json({
          error: 'El correo ya se encuentra registrado en el sistema.',
          campo: 'correo_contacto',
        });
      }
    }

    if (fecha_nacimiento) {
      const edad = Math.floor((Date.now() - new Date(fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (edad < 12) {
        return res.status(400).json({
          error: 'Debes tener al menos 12 años de edad para registrarte.',
          campo: 'fecha_nacimiento',
        });
      }
    }

    const item = await sequelize.transaction(async (t) => {
      const cultor = await Cultores.create({
        ...req.body,
        fecha_nacimiento: req.body.fecha_nacimiento ? toDateOnly(req.body.fecha_nacimiento) : null,
        fecha_registro: new Date(),
        estatus: 'pendiente',
        // Esta es la postulación pública: el propio cultor es quien envía el
        // formulario, así que por definición está vivo. El ingreso manual del admin
        // (ingresoManual, más abajo) no fija este campo — ahí queda a criterio del admin.
        estatus_vida: 'activo',
      }, { transaction: t });

      await crearDocumentosDelCultor(cultor.id_cultor, req.files, t);

      return cultor;
    });

    res.status(201).json(item.toJSON());
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const campo = err.fields ? Object.keys(err.fields)[0] : 'dato';
      const mensajes = {
        cedula: 'La cédula ya se encuentra registrada en el sistema.',
        correo_contacto: 'El correo ya se encuentra registrado en el sistema.',
      };
      return res.status(409).json({
        error: mensajes[campo] || 'El dato ya se encuentra registrado.',
        campo,
      });
    }
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

// Crea el Usuario (rol 'cultor') vinculado a un Cultor recién aprobado: busca/crea el
// rol, genera y hashea la contraseña temporal, crea el Usuario y enlaza id_usuario.
// Devuelve { passwordTemporal } para que el caller construya la respuesta al admin.
// Compartido por updateEstatus (aprobación manual de un pendiente) e ingresoManual
// (alta directa ya aprobada) para no duplicar esta lógica en dos lugares.
async function crearUsuarioParaCultor(cultor, t) {
  let rolCultor = await Roles.findOne({
    where: sequelize.where(sequelize.fn('lower', sequelize.col('nombre_rol')), 'cultor'),
    transaction: t
  });
  if (!rolCultor) {
    rolCultor = await Roles.create(
      { nombre_rol: 'Cultor', descripcion: 'Rol de cultor' },
      { transaction: t }
    );
  }

  const passwordTemporal = crypto.randomBytes(9).toString('base64url'); // 12 chars approx.
  const password_hash = await hashPassword(passwordTemporal);

  const nuevoUsuario = await Usuarios.create(
    {
      primer_nombre: cultor.primer_nombre,
      segundo_nombre: cultor.segundo_nombre,
      primer_apellido: cultor.primer_apellido,
      segundo_apellido: cultor.segundo_apellido,
      correo: cultor.correo_contacto,
      password_hash,
      password_temporal: true,
      id_rol: rolCultor.id_rol,
      telefono: cultor.telefono_contacto,
      activo: true,
      fecha_registro: new Date(),
    },
    { transaction: t }
  );

  await cultor.update({ id_usuario: nuevoUsuario.id_usuario }, { transaction: t });

  await Notificaciones.create(
    {
      id_usuario: nuevoUsuario.id_usuario,
      titulo: 'Cambia tu contraseña temporal',
      mensaje: 'Tu cuenta fue creada con una contraseña generada por el sistema. Por seguridad, cámbiala cuanto antes desde tu perfil.',
      tipo: 'alerta',
    },
    { transaction: t }
  );

  return { passwordTemporal };
}

// Ingreso manual del admin: a diferencia de create() (siempre 'pendiente'), este crea
// el Cultor YA aprobado y su Usuario+contraseña en la misma transacción. Ruta protegida
// (requireAuth + requireRole admin) — nunca expuesta sin auth, porque permite
// auto-aprobación inmediata. La cédula (y soportes, si los hay) se crean en la misma
// transacción — misma garantía "todo o nada" que en create().
exports.ingresoManual = async (req, res, next) => {
  try {
    if (!req.body.correo_contacto) {
      return res.status(400).json({
        error: 'El ingreso manual requiere correo_contacto para poder crear el acceso del cultor.',
      });
    }

    if (!req.files?.archivo_cedula?.[0]) {
      return res.status(400).json({
        error: 'Debes adjuntar la foto o documento de la cédula para completar el registro.',
      });
    }

    // Mismas verificaciones previas que create(): evita subir la cédula a Cloudinary
    // para nada cuando el duplicado se puede detectar antes, y da un 409 claro con el
    // campo exacto en vez de depender del error genérico de restricción única de la BD.
    if (req.body.cedula) {
      const existeCedula = await Cultores.findOne({ where: { cedula: req.body.cedula } });
      if (existeCedula) {
        return res.status(409).json({
          error: 'La cédula ya se encuentra registrada en el sistema.',
          campo: 'cedula',
        });
      }
    }

    if (req.body.correo_contacto) {
      const existeCorreo = await Cultores.findOne({ where: { correo_contacto: req.body.correo_contacto } });
      if (existeCorreo) {
        return res.status(409).json({
          error: 'El correo ya se encuentra registrado en el sistema.',
          campo: 'correo_contacto',
        });
      }
    }

    let passwordTemporal;

    const cultorCreado = await sequelize.transaction(async (t) => {
      const cultor = await Cultores.create(
        { ...req.body, fecha_nacimiento: req.body.fecha_nacimiento ? toDateOnly(req.body.fecha_nacimiento) : null, fecha_registro: new Date(), estatus: 'aprobado' },
        { transaction: t }
      );

      await crearDocumentosDelCultor(cultor.id_cultor, req.files, t);

      ({ passwordTemporal } = await crearUsuarioParaCultor(cultor, t));

      return cultor;
    });

    const respuesta = cultorCreado.get({ plain: true });
    if (respuesta.fecha_nacimiento) {
      respuesta.fecha_nacimiento = toDateOnly(respuesta.fecha_nacimiento);
    }
    respuesta.credencialesNuevas = {
      correo: cultorCreado.correo_contacto,
      nombre: `${cultorCreado.primer_nombre} ${cultorCreado.primer_apellido}`,
      passwordTemporal,
    };

    res.status(201).json(respuesta);
  } catch (err) {
    // Mismo manejo que create(): si de todas formas se cuela un duplicado (condición
    // de carrera entre la verificación previa y el insert), responde 409 con el campo
    // exacto en vez del 400 genérico de Sequelize.
    if (err.name === 'SequelizeUniqueConstraintError') {
      const campo = err.fields ? Object.keys(err.fields)[0] : 'dato';
      const mensajes = {
        cedula: 'La cédula ya se encuentra registrada en el sistema.',
        correo_contacto: 'El correo ya se encuentra registrado en el sistema.',
      };
      return res.status(409).json({
        error: mensajes[campo] || 'El dato ya se encuentra registrado.',
        campo,
      });
    }
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

// Actualizar un registro
exports.update = async (req, res, next) => {
  try {
    const item = await Cultores.findByPk(req.params.id_cultor || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en cultores' });
    }
    if (req.body.fecha_nacimiento) {
      req.body.fecha_nacimiento = toDateOnly(req.body.fecha_nacimiento);
    }
    await item.update(req.body);
    try { getIO().emit('cultor:updated', { id_cultor: item.id_cultor }); } catch (_) {}
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Cambiar el estatus (aprobar/rechazar). Acción dedicada y auditable, separada del PUT genérico.
// Al aprobar por primera vez, crea automáticamente el Usuario (rol 'cultor') vinculado
// al registro, dentro de una transacción, y le envía sus credenciales por correo.
exports.updateEstatus = async (req, res, next) => {
  const { estatus } = req.body;

  try {
    const cultor = await Cultores.findByPk(req.params.id_cultor);
    if (!cultor) {
      return res.status(404).json({ error: 'Registro no encontrado en cultores' });
    }

    // Validación inicial: sin correo no hay a quién crearle cuenta ni notificar.
    if (estatus === 'aprobado' && !cultor.id_usuario && !cultor.correo_contacto) {
      return res.status(400).json({
        error: 'No se puede aprobar automáticamente: el cultor no tiene correo_contacto registrado.',
      });
    }

    let credencialesNuevas = null; // { correo, passwordTemporal } solo si se crea un usuario nuevo

    const cultorActualizado = await sequelize.transaction(async (t) => {
      // Doble aprobación / re-aprobación tras un rechazo: el usuario ya existe, no se duplica.
      if (estatus === 'aprobado' && !cultor.id_usuario) {
        const { passwordTemporal } = await crearUsuarioParaCultor(cultor, t);
        await cultor.update({ estatus }, { transaction: t });
        credencialesNuevas = { correo: cultor.correo_contacto, passwordTemporal };
      } else {
        await cultor.update({ estatus }, { transaction: t });
      }

      return cultor;
    });

    // El envío de correo se migró a EmailJS en el frontend: el backend ya no manda
    // nada por SMTP. Si se creó un usuario nuevo, se devuelve la contraseña temporal
    // en texto plano SOLO en esta respuesta puntual, para que el dashboard del admin
    // dispare la plantilla de credenciales hacia el correo del cultor.
    const respuesta = cultorActualizado.get({ plain: true });
    if (respuesta.fecha_nacimiento) {
      respuesta.fecha_nacimiento = toDateOnly(respuesta.fecha_nacimiento);
    }
    if (credencialesNuevas) {
      respuesta.credencialesNuevas = {
        correo: credencialesNuevas.correo,
        nombre: `${cultor.primer_nombre} ${cultor.primer_apellido}`,
        passwordTemporal: credencialesNuevas.passwordTemporal,
      };
    }

    try { getIO().emit('cultor:updated', { id_cultor: cultor.id_cultor }); } catch (_) {}

    res.json(respuesta);
  } catch (err) {
    next(err);
  }
};

// El cultor actualiza sus propios datos personales (PATCH /cultores/mi-perfil).
// Solo permite modificar campos de información personal seguros — nunca estatus,
// id_usuario, fecha_registro, etc. El middleware requireOwnCultorOrAdmin ya verificó
// que el req.auth.id_usuario es el dueño del registro o es admin.
exports.updateMiPerfil = async (req, res, next) => {
  try {
    // req.cultor fue asignado por requireOwnCultorOrAdmin
    const cultor = req.cultor || await Cultores.findOne({ where: { id_usuario: req.auth.id_usuario } });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }

    const cambios = {};
    for (const campo of Object.keys(req.body)) {
      let valor = req.body[campo];
      if (campo === 'fecha_nacimiento' && valor) {
        valor = toDateOnly(valor);
      }
      cambios[campo] = valor;
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar.' });
    }

    await cultor.update(cambios);
    try { getIO().emit('cultor:updated', { id_cultor: cultor.id_cultor }); } catch (_) {}
    res.json(cultor);
  } catch (err) {
    next(err);
  }
};

// Añade texto al resumen_curricular del cultor logueado (appending).
exports.appendCurriculum = async (req, res, next) => {
  try {
    const cultor = req.cultor || await Cultores.findOne({ where: { id_usuario: req.auth.id_usuario } });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }

    const { texto } = req.body;
    const anterior = cultor.resumen_curricular || '';
    const nuevo = anterior ? `${anterior}\n\n${texto.trim()}` : texto.trim();
    await cultor.update({ resumen_curricular: nuevo });
    try { getIO().emit('cultor:updated', { id_cultor: cultor.id_cultor }); } catch (_) {}
    res.json(cultor);
  } catch (err) {
    next(err);
  }
};

// Activar / desactivar el usuario vinculado al cultor (toggle activo).
// Solo para administradores. Requiere que el cultor tenga un id_usuario asociado.
exports.toggleActivo = async (req, res, next) => {
  try {
    const cultor = await Cultores.findByPk(req.params.id_cultor, {
      include: [{ model: Usuarios, as: 'usuario', attributes: ['id_usuario', 'activo'] }],
    });
    if (!cultor) {
      return res.status(404).json({ error: 'Registro no encontrado en cultores' });
    }
    if (!cultor.usuario) {
      return res.status(400).json({ error: 'Este cultor no tiene un usuario vinculado.' });
    }

    const nuevoValor = !cultor.usuario.activo;
    await cultor.usuario.update({ activo: nuevoValor });
    res.json({ id_cultor: cultor.id_cultor, activo: nuevoValor });
  } catch (err) {
    next(err);
  }
};

// Subir foto de perfil del cultor logueado (multipart, Cloudinary)
exports.subirFoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debe seleccionar una imagen' });
    }

    const cultor = await Cultores.findOne({ where: { id_usuario: req.auth.id_usuario } });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }

    const resCloud = await subirBuffer(req.file.buffer, {
      folder: 'archivo-tachira/fotos-perfil',
      publicId: `cultor_${cultor.id_cultor}_${Date.now()}`,
    });

    await cultor.update({ foto_perfil: resCloud.secure_url });

    res.json({ foto_perfil: cultor.foto_perfil });
  } catch (err) {
    next(err);
  }
};

// Eliminar la foto de perfil del cultor logueado (deja el campo vacío, sin subir nada).
exports.eliminarFoto = async (req, res, next) => {
  try {
    const cultor = await Cultores.findOne({ where: { id_usuario: req.auth.id_usuario } });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }

    await cultor.update({ foto_perfil: null });

    res.json({ foto_perfil: null });
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro
exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await Cultores.findByPk(req.params.id_cultor || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en cultores' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};