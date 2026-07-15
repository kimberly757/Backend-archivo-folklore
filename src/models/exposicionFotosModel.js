const factory = (sequelize, DataTypes) => {
  const ExposicionFotos = sequelize.define('ExposicionFotos', {
    id_foto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_exposicion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url_archivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_archivo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_carga: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'exposicion_fotos',
    timestamps: false,
  });

  return ExposicionFotos;
};

module.exports = factory;
