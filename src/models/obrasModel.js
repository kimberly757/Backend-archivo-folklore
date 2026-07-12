const factory = (sequelize, DataTypes) => {
  const Obras = sequelize.define('Obras', {
    id_obra: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_cultor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_categoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_parroquia: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipo_patrimonio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    descripcion_historica: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    materiales_utilizados: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dimensiones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    peso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    tecnica_utilizada: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tiempo_ejecucion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    anio_creacion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    significado_cultural: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado_conservacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ubicacion_actual: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    valor_estimado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    codigo_qr_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    destacado_galeria: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    observaciones_admin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_postulacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'obras',
    timestamps: false,
  });

  return Obras;
};

factory.tableName = 'obras';
factory.idColumns = ["id_obra"];

module.exports = factory;
