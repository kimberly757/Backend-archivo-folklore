const tableName = 'manifestaciones_folklore';
const idColumns = ['id_manifestacion'];
const columns = [
  'id_manifestacion',
  'id_tipo_folklore',
  'nombre',
  'descripcion',
  'id_parroquia',
  'origen_historico',
  'vigencia_actual',
  'observaciones',
  'estatus',
  'id_usuario_registro',
  'fecha_registro',
];

module.exports = { tableName, idColumns, columns };
