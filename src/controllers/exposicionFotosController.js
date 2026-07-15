const { ExposicionFotos } = require('../models');
const { subirBuffer } = require('../services/cloudinaryService');

// Listar fotos de una exposición
exports.getByExposicion = async (req, res, next) => {
  try {
    const { id_exposicion } = req.params;
    const items = await ExposicionFotos.findAll({
      where: { id_exposicion },
      order: [['fecha_carga', 'DESC']],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Subir fotos a una exposición
exports.upload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Debes adjuntar al menos un archivo.' });
    }

    const { id_exposicion } = req.body;
    if (!id_exposicion) {
      return res.status(400).json({ error: 'id_exposicion es requerido.' });
    }

    const fotos = [];
    for (const file of req.files) {
      const resultado = await subirBuffer(file.buffer, {
        folder: 'archivo-tachira/exposiciones',
        publicId: `expo_${id_exposicion}_${Date.now()}_${fotos.length}`,
      });

      const foto = await ExposicionFotos.create({
        id_exposicion,
        url_archivo: resultado.secure_url,
        nombre_archivo: file.originalname,
        fecha_carga: new Date(),
      });
      fotos.push(foto);
    }

    res.status(201).json(fotos);
  } catch (err) {
    next(err);
  }
};

// Eliminar una foto de exposición
exports.remove = async (req, res, next) => {
  try {
    const item = await ExposicionFotos.findByPk(req.params.id_foto);
    if (!item) {
      return res.status(404).json({ error: 'Foto no encontrada.' });
    }
    await item.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
