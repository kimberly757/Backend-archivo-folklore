const { ConfiguracionWeb } = require('../models');

// Obtener la configuración actual (Público)
exports.get = async (req, res, next) => {
  try {
    let config = await ConfiguracionWeb.findOne();
    if (!config) {
      // Si no existe, creamos la fila por defecto
      config = await ConfiguracionWeb.create({});
    }
    res.json(config);
  } catch (err) {
    next(err);
  }
};

// Actualizar la configuración (Protegido)
exports.update = async (req, res, next) => {
  try {
    let config = await ConfiguracionWeb.findOne();
    if (!config) {
      config = await ConfiguracionWeb.create({});
    }
    
    // Actualizar los campos permitidos
    const camposPermitidos = [
      'hero_titulo',
      'hero_subtitulo',
      'about_texto',
      'contacto_email',
      'contacto_telefono',
      'contacto_direccion'
    ];

    const dataAActualizar = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        dataAActualizar[campo] = req.body[campo];
      }
    }

    await config.update(dataAActualizar);

    res.json({ message: 'Configuración actualizada exitosamente', data: config });
  } catch (err) {
    next(err);
  }
};
