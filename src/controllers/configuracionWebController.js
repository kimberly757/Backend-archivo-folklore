const { ConfiguracionWeb } = require('../models');
const { subirBuffer } = require('../services/cloudinaryService');

// Obtener la configuración actual (Público)
exports.get = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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
    
    const camposPermitidos = [
      'hero_titulo',
      'hero_subtitulo',
      'about_texto',
      'contacto_email',
      'contacto_telefono',
      'contacto_direccion',
      'login_titulo',
      'login_subtitulo',
      'login_top_label',
      'login_bottom_label'
    ];

    const dataAActualizar = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        dataAActualizar[campo] = req.body[campo];
      }
    }

    // Procesar imágenes subidas si existen (en paralelo para mejorar velocidad)
    if (req.files) {
      const uploadPromises = [];

      if (req.files['hero_imagen'] && req.files['hero_imagen'][0]) {
        const file = req.files['hero_imagen'][0];
        uploadPromises.push(
          subirBuffer(file.buffer, {
            folder: 'archivo-tachira/config',
            publicId: `hero_bg_${Date.now()}`
          }).then(resCloud => {
            dataAActualizar.hero_imagen = resCloud.secure_url;
          })
        );
      }

      if (req.files['about_imagen'] && req.files['about_imagen'][0]) {
        const file = req.files['about_imagen'][0];
        uploadPromises.push(
          subirBuffer(file.buffer, {
            folder: 'archivo-tachira/config',
            publicId: `about_img_${Date.now()}`
          }).then(resCloud => {
            dataAActualizar.about_imagen = resCloud.secure_url;
          })
        );
      }

      if (req.files['login_imagen'] && req.files['login_imagen'][0]) {
        const file = req.files['login_imagen'][0];
        uploadPromises.push(
          subirBuffer(file.buffer, {
            folder: 'archivo-tachira/config',
            publicId: `login_bg_${Date.now()}`
          }).then(resCloud => {
            dataAActualizar.login_imagen = resCloud.secure_url;
          })
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }
    }

    await config.update(dataAActualizar);

    res.json({ message: 'Configuración actualizada exitosamente', data: config });
  } catch (err) {
    next(err);
  }
};
