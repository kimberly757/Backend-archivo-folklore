const { DocumentosCultor, Cultores } = require('../models');
const { subirBuffer } = require('../services/cloudinaryService');
const { validarCedula } = require('../services/ocrService');

// Listar todos los registros
exports.list = exports.getAll = async (req, res, next) => {
  try {
    const items = await DocumentosCultor.findAll();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Listar documentos del cultor autenticado (solo documentos de soporte)
exports.getMisDocumentos = async (req, res, next) => {
  try {
    const cultor = await Cultores.findOne({ where: { id_usuario: req.auth.id_usuario } });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }
    const items = await DocumentosCultor.findAll({
      where: { id_cultor: cultor.id_cultor, tipo_documento: 'soporte' },
      order: [['fecha_carga', 'DESC']],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Eliminar un documento de soporte propio (requireAuth, verifica que pertenezca al cultor)
exports.deleteMisDocumentos = async (req, res, next) => {
  try {
    const cultor = await Cultores.findOne({ where: { id_usuario: req.auth.id_usuario } });
    if (!cultor) {
      return res.status(404).json({ error: 'No existe un registro de cultor vinculado a esta cuenta.' });
    }
    const item = await DocumentosCultor.findByPk(req.params.id_documento);
    if (!item) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }
    if (item.id_cultor !== cultor.id_cultor) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este documento.' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Obtener un registro por ID
exports.get = exports.getById = async (req, res, next) => {
  try {
    const item = await DocumentosCultor.findByPk(req.params.id_documento || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en documentos_cultor' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Crear un registro
exports.create = async (req, res, next) => {
  try {
    const item = await DocumentosCultor.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// Actualizar un registro
exports.update = async (req, res, next) => {
  try {
    const item = await DocumentosCultor.findByPk(req.params.id_documento || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en documentos_cultor' });
    }
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Valida mediante OCR que la imagen sea una Cédula de Identidad venezolana,
// SIN crear ningún registro. Útil para validar antes de enviar el formulario.
exports.validarCedulaImagen = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes adjuntar un archivo de imagen.' });
    }

    const { valido, coincidencias, cedulaExtraida, nombresExtraidos } = await validarCedula(req.file.buffer);

    if (!valido) {
      const motivos = [];
      if (!coincidencias.palabrasClave) {
        motivos.push('No se encontraron las frases "REPÚBLICA BOLIVARIANA DE VENEZUELA" o "CÉDULA DE IDENTIDAD"');
      }
      if (!coincidencias.numeroIdentidad) {
        motivos.push('No se encontró un número de cédula con formato V-12345678 o E-12345678');
      }
      return res.status(422).json({
        error: 'La imagen proporcionada no parece ser una Cédula de Identidad venezolana válida.',
        detalles: motivos,
      });
    }

    res.json({
      valido: true,
      message: 'La imagen corresponde a una Cédula de Identidad válida.',
      cedulaExtraida,
      nombresExtraidos,
    });
  } catch (err) {
    if (err.ocrFallo) {
      return res.status(err.status || 422).json({ error: err.message });
    }
    next(err);
  }
};

// Sube la foto/documento de cédula de un cultor: recibe el archivo (Multer, en memoria),
// lo envía a Cloudinary y guarda la URL resultante en documentos_cultor.
// NO vuelve a correr el OCR aquí: el flujo de ambos formularios (RegisterForm.jsx y
// ManualCultorForm.jsx) ya llama a POST /documentos_cultor/validar-cedula con este mismo
// archivo justo ANTES de crear el cultor, y solo llega a este punto si esa validación
// pasó. Repetir el OCR aquí era redundante y, al ser Tesseract no 100% determinista,
// podía fallar por segunda vez en la misma imagen ya validada — dejando un cultor creado
// sin documento y un error confuso ("se postuló igual"). Validar una sola vez, antes de
// crear el registro, es lo correcto.
exports.uploadCedula = async (req, res, next) => {
  try {
    console.log('[uploadCedula] LLEGÓ PETICIÓN. file:', !!req.file, 'size:', req.file?.size, 'mime:', req.file?.mimetype, 'id_cultor:', req.body?.id_cultor);

    if (!req.file) {
      console.log('[uploadCedula] ERROR: no hay archivo');
      return res.status(400).json({ error: 'Debes adjuntar un archivo de imagen.' });
    }

    const { id_cultor } = req.body;
    if (!id_cultor) {
      console.log('[uploadCedula] ERROR: no hay id_cultor');
      return res.status(400).json({ error: 'id_cultor es requerido.' });
    }

    console.log('[uploadCedula] Subiendo a Cloudinary...');
    const resultado = await subirBuffer(req.file.buffer, {
      folder: 'archivo-tachira/cedulas',
      publicId: `cultor_${id_cultor}_${Date.now()}`,
    });
    console.log('[uploadCedula] Cloudinary OK:', resultado.secure_url);

    console.log('[uploadCedula] Creando registro en BD...');
    const documento = await DocumentosCultor.create({
      id_cultor,
      tipo_documento: 'cedula',
      url_archivo: resultado.secure_url,
      nombre_archivo: req.file.originalname,
      fecha_carga: new Date(),
      id_usuario_carga: req.auth?.id_usuario || null,
    });
    console.log('[uploadCedula] Documento CREADO:', documento.id_documento);

    res.status(201).json(documento);
  } catch (err) {
    console.log('[uploadCedula] ERROR en catch:', err.message);
    if (err.ocrFallo) {
      return res.status(err.status || 422).json({ error: err.message });
    }
    next(err);
  }
};

// Subir múltiples documentos de soporte (vía POST /documentos_cultor/subir-soporte).
// Recibe un array de archivos bajo el campo "archivos" y los asocia al id_cultor.
exports.uploadSoporte = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Debes adjuntar al menos un archivo.' });
    }

    const { id_cultor } = req.body;
    if (!id_cultor) {
      return res.status(400).json({ error: 'id_cultor es requerido.' });
    }

    const documentos = [];
    for (const file of req.files) {
      const resultado = await subirBuffer(file.buffer, {
        folder: 'archivo-tachira/documentos-soporte',
        publicId: `soporte_${id_cultor}_${Date.now()}_${documentos.length}`,
      });

      const doc = await DocumentosCultor.create({
        id_cultor,
        tipo_documento: 'soporte',
        url_archivo: resultado.secure_url,
        nombre_archivo: file.originalname,
        fecha_carga: new Date(),
        id_usuario_carga: req.auth?.id_usuario || null,
      });
      documentos.push(doc);
    }

    res.status(201).json(documentos);
  } catch (err) {
    next(err);
  }
};

// Eliminar un registro
exports.remove = exports.delete = async (req, res, next) => {
  try {
    const item = await DocumentosCultor.findByPk(req.params.id_documento || req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado en documentos_cultor' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
