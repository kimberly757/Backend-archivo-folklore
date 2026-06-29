const { Obras, Exposiciones, ExposicionObras, Cultores } = require('../models');

// Obtener todas las obras que están marcadas para mostrarse en la web pública
exports.getGaleriaPublica = async (req, res, next) => {
  try {
    const obras = await Obras.findAll({
      where: {
        destacado_galeria: 'si'
      },
      include: [{
        model: Cultores,
        as: 'cultor',
        attributes: ['nombre', 'apellido']
      }]
    });
    res.json(obras);
  } catch (err) {
    next(err);
  }
};

// Obtener la exposición activa y sus obras vinculadas
exports.getExposicionActiva = async (req, res, next) => {
  try {
    const exposicion = await Exposiciones.findOne({
      where: { estatus: 'activa' }
    });

    if (!exposicion) {
      return res.json(null); // No hay exposición activa
    }

    const vinculaciones = await ExposicionObras.findAll({
      where: { id_exposicion: exposicion.id_exposicion }
    });

    const obrasIds = vinculaciones.map(v => v.id_obra);
    let obras = [];
    
    if (obrasIds.length > 0) {
      obras = await Obras.findAll({
        where: { id_obra: obrasIds }
      });
    }

    res.json({
      exposicion,
      obras
    });
  } catch (err) {
    next(err);
  }
};
