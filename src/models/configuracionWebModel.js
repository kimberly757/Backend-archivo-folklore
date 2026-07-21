const factory = (sequelize, DataTypes) => {
  const ConfiguracionWeb = sequelize.define('ConfiguracionWeb', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hero_titulo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Preservando la Memoria Cultural del Táchira'
    },
    hero_subtitulo: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Un archivo digital colaborativo que rescata el oficio, la mano y la historia de nuestros cultores, conectando a los artesanos del Táchira con quienes valoran su legado.'
    },
    about_texto: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Este proyecto nace con la misión de salvaguardar el inmenso acervo cultural de la región andina. A través de la documentación rigurosa y la participación activa de las comunidades, construimos un puente entre las generaciones pasadas y futuras.'
    },
    contacto_email: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'contacto@archivofolklore.gob.ve'
    },
    contacto_telefono: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '+58 276 123 4567'
    },
    contacto_direccion: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'San Cristóbal, Estado Táchira, Venezuela'
    },
    contacto_horario: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Martes a Viernes: 8:00 AM – 4:00 PM\nSábados y Domingos: 10:00 AM – 4:00 PM'
    },
    hero_imagen: {
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    about_imagen: {
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    login_titulo: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      defaultValue: 'Inicio de Sesión'
    },
    login_subtitulo: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      defaultValue: 'Archivo Regional del Folklore y Patrimonio Cultural "Luis Felipe Ramón y Rivera"'
    },
    login_top_label: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      defaultValue: 'Ministerio de Cultura'
    },
    login_bottom_label: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      defaultValue: 'Sistema de Gestión y Control Patrimonial'
    },
    login_imagen: {
      type: DataTypes.STRING(2048),
      allowNull: true
    }
  }, {
    tableName: 'configuracion_web',
    timestamps: false,
  });

  return ConfiguracionWeb;
};

factory.tableName = 'configuracion_web';
factory.idColumns = ["id"];

module.exports = factory;
