const { Cultores, Obras, Usuarios, Parroquias, Municipios, sequelize } = require('../models');

exports.getStats = async (req, res, next) => {
  try {
    const obrasCount = await Obras.count({ where: { estatus: 'aprobado' } });
    const cultoresCount = await Cultores.count({
      where: { estatus: 'aprobado' },
      include: [{
        model: Usuarios,
        as: 'usuario',
        where: { activo: true },
        required: true,
      }],
    });

    const [rawResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT m.id_municipio) AS total
      FROM cultores c
      INNER JOIN usuarios u ON u.id_usuario = c.id_usuario AND u.activo = true
      INNER JOIN parroquias p ON p.id_parroquia = c.id_parroquia
      INNER JOIN municipios m ON m.id_municipio = p.id_municipio
      WHERE c.estatus = 'aprobado'
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({
      obras_aprobadas: obrasCount,
      cultores_activos: cultoresCount,
      municipios: Number(rawResult?.total || 0),
    });
  } catch (err) {
    next(err);
  }
};
