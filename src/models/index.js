const { sequelize, Sequelize } = require('../config/database');

// Cargar modelos
const Auditoria = require('./auditoriaModel')(sequelize, Sequelize.DataTypes);
const CategoriasObra = require('./categoriasObraModel')(sequelize, Sequelize.DataTypes);
const Cultores = require('./cultoresModel')(sequelize, Sequelize.DataTypes);
const CultorManifestaciones = require('./cultorManifestacionesModel')(sequelize, Sequelize.DataTypes);
const CultorOficios = require('./cultorOficiosModel')(sequelize, Sequelize.DataTypes);
const DocumentosCultor = require('./documentosCultorModel')(sequelize, Sequelize.DataTypes);
const Exposiciones = require('./exposicionesModel')(sequelize, Sequelize.DataTypes);
const ExposicionManifestaciones = require('./exposicionManifestacionesModel')(sequelize, Sequelize.DataTypes);
const ExposicionObras = require('./exposicionObrasModel')(sequelize, Sequelize.DataTypes);
const FeDeVida = require('./feDeVidaModel')(sequelize, Sequelize.DataTypes);
const Manifestaciones = require('./manifestacionesModel')(sequelize, Sequelize.DataTypes);
const Multimedia = require('./multimediaModel')(sequelize, Sequelize.DataTypes);
const Municipios = require('./municipiosModel')(sequelize, Sequelize.DataTypes);
const Notificaciones = require('./notificacionesModel')(sequelize, Sequelize.DataTypes);
const Obras = require('./obrasModel')(sequelize, Sequelize.DataTypes);
const Oficios = require('./oficiosModel')(sequelize, Sequelize.DataTypes);
const Parroquias = require('./parroquiasModel')(sequelize, Sequelize.DataTypes);
const Reportes = require('./reportesModel')(sequelize, Sequelize.DataTypes);
const Sesiones = require('./sesionesModel')(sequelize, Sequelize.DataTypes);
const Tipos = require('./tiposFolkloreModel')(sequelize, Sequelize.DataTypes);
const Usuarios = require('./usuariosModel')(sequelize, Sequelize.DataTypes);
const Roles = require('./rolesModel')(sequelize, Sequelize.DataTypes);
const ConfiguracionWeb = require('./configuracionWebModel')(sequelize, Sequelize.DataTypes);

// Relaciones: Parroquias <-> Municipios
Parroquias.belongsTo(Municipios, { foreignKey: 'id_municipio', as: 'municipio' });
Municipios.hasMany(Parroquias, { foreignKey: 'id_municipio', as: 'parroquias' });

// Relaciones: Usuarios <-> Roles
Usuarios.belongsTo(Roles, { foreignKey: 'id_rol', as: 'rolRel' });
Roles.hasMany(Usuarios, { foreignKey: 'id_rol', as: 'usuarios' });

// Relaciones: Cultores <-> Usuarios
Cultores.belongsTo(Usuarios, { foreignKey: 'id_usuario', as: 'usuario' });
Usuarios.hasOne(Cultores, { foreignKey: 'id_usuario', as: 'cultor' });

// Relaciones: Cultores <-> Parroquias
Cultores.belongsTo(Parroquias, { foreignKey: 'id_parroquia', as: 'parroquia' });

// Relaciones: DocumentosCultor <-> Cultores
DocumentosCultor.belongsTo(Cultores, { foreignKey: 'id_cultor', as: 'cultor' });
Cultores.hasMany(DocumentosCultor, { foreignKey: 'id_cultor', as: 'documentos' });

// Relaciones: FeDeVida <-> Cultores
FeDeVida.belongsTo(Cultores, { foreignKey: 'id_cultor', as: 'cultor' });
Cultores.hasMany(FeDeVida, { foreignKey: 'id_cultor', as: 'fesDeVida' });

// Relaciones: Obras <-> Cultores
Obras.belongsTo(Cultores, { foreignKey: 'id_cultor', as: 'cultor' });
Cultores.hasMany(Obras, { foreignKey: 'id_cultor', as: 'obras' });

// Relaciones: Obras <-> CategoriasObra
Obras.belongsTo(CategoriasObra, { foreignKey: 'id_categoria', as: 'categoria' });
CategoriasObra.hasMany(Obras, { foreignKey: 'id_categoria', as: 'obras' });

// Relaciones: Obras <-> Parroquias
Obras.belongsTo(Parroquias, { foreignKey: 'id_parroquia', as: 'parroquia' });

// Relaciones: Manifestaciones <-> Tipos (tipo de folklore)
Manifestaciones.belongsTo(Tipos, { foreignKey: 'id_tipo_folklore', as: 'tipoFolklore' });
Tipos.hasMany(Manifestaciones, { foreignKey: 'id_tipo_folklore', as: 'manifestaciones' });

// Relaciones: Manifestaciones <-> Parroquias
Manifestaciones.belongsTo(Parroquias, { foreignKey: 'id_parroquia', as: 'parroquia' });

// Relaciones: Multimedia
Multimedia.belongsTo(Cultores, { foreignKey: 'id_cultor', as: 'cultor', allowNull: true });
Multimedia.belongsTo(Obras, { foreignKey: 'id_obra', as: 'obra', allowNull: true });
Multimedia.belongsTo(Manifestaciones, { foreignKey: 'id_manifestacion', as: 'manifestacion', allowNull: true });

// Relaciones: Notificaciones <-> Usuarios
Notificaciones.belongsTo(Usuarios, { foreignKey: 'id_usuario', as: 'usuario' });
Usuarios.hasMany(Notificaciones, { foreignKey: 'id_usuario', as: 'notificaciones' });

// Relaciones: Sesiones <-> Usuarios
Sesiones.belongsTo(Usuarios, { foreignKey: 'id_usuario', as: 'usuario' });

// Relaciones: Auditoria <-> Usuarios
Auditoria.belongsTo(Usuarios, { foreignKey: 'id_usuario', as: 'usuario', allowNull: true });

// Relaciones: Reportes <-> Usuarios
Reportes.belongsTo(Usuarios, { foreignKey: 'id_usuario_generador', as: 'generador' });

// Relaciones Muchos a Muchos: Cultores <-> Manifestaciones
Cultores.belongsToMany(Manifestaciones, {
  through: CultorManifestaciones,
  foreignKey: 'id_cultor',
  otherKey: 'id_manifestacion',
  as: 'manifestaciones'
});
Manifestaciones.belongsToMany(Cultores, {
  through: CultorManifestaciones,
  foreignKey: 'id_manifestacion',
  otherKey: 'id_cultor',
  as: 'cultores'
});

// Relaciones Muchos a Muchos: Cultores <-> Oficios
Cultores.belongsToMany(Oficios, {
  through: CultorOficios,
  foreignKey: 'id_cultor',
  otherKey: 'id_oficio',
  as: 'oficios'
});
Oficios.belongsToMany(Cultores, {
  through: CultorOficios,
  foreignKey: 'id_oficio',
  otherKey: 'id_cultor',
  as: 'cultores'
});

// Relaciones Muchos a Muchos: Exposiciones <-> Manifestaciones
Exposiciones.belongsToMany(Manifestaciones, {
  through: ExposicionManifestaciones,
  foreignKey: 'id_exposicion',
  otherKey: 'id_manifestacion',
  as: 'manifestaciones'
});
Manifestaciones.belongsToMany(Exposiciones, {
  through: ExposicionManifestaciones,
  foreignKey: 'id_manifestacion',
  otherKey: 'id_exposicion',
  as: 'exposiciones'
});

// Relaciones Muchos a Muchos: Exposiciones <-> Obras
Exposiciones.belongsToMany(Obras, {
  through: ExposicionObras,
  foreignKey: 'id_exposicion',
  otherKey: 'id_obra',
  as: 'obras'
});
Obras.belongsToMany(Exposiciones, {
  through: ExposicionObras,
  foreignKey: 'id_obra',
  otherKey: 'id_exposicion',
  as: 'exposiciones'
});

module.exports = {
  sequelize,
  Sequelize,
  Auditoria,
  CategoriasObra,
  Cultores,
  CultorManifestaciones,
  CultorOficios,
  DocumentosCultor,
  Exposiciones,
  ExposicionManifestaciones,
  ExposicionObras,
  FeDeVida,
  Manifestaciones,
  Multimedia,
  Municipios,
  Notificaciones,
  Obras,
  Oficios,
  Parroquias,
  Reportes,
  Sesiones,
  Tipos,
  Usuarios,
  Roles,
  ConfiguracionWeb,
};
