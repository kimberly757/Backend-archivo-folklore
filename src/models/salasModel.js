const factory = (sequelize, DataTypes) => {
  const Salas = sequelize.define('Salas', {
    id_sala: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'Exhibición',
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Habilitada',
    },
  }, {
    tableName: 'salas',
    timestamps: false,
  });

  return Salas;
};

factory.tableName = 'salas';
factory.idColumns = ['id_sala'];

module.exports = factory;
