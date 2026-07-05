const factory = (sequelize, DataTypes) => {
  const Efemerides = sequelize.define('Efemerides', {
    id_efemeride: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Día y mes del calendario (recurrente cada año), separados del año histórico de
    // referencia para poder ordenar/mostrar la efeméride sin importar el año actual.
    dia: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Año en que ocurrió el hecho histórico (opcional, ej. 1811). No es el año en que
    // se muestra la efeméride: esa se repite cada año en el mismo día/mes.
    anio_referencia: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    imagen: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    // Si es false, la efeméride no aparece en la web pública. Cuando no hay
    // ninguna activa, la sección completa se oculta.
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    id_usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'efemerides',
    timestamps: false,
  });

  return Efemerides;
};

factory.tableName = 'efemerides';
factory.idColumns = ["id_efemeride"];

module.exports = factory;
