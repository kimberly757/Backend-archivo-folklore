const tableName = 'multimedia';
const idColumns = ['id_multimedia'];
const columns = [
  'id_multimedia',
  'tipo_archivo',
  'url_archivo',
  'nombre_archivo',
  'descripcion',
  'id_obra',
  'id_cultor',
  'id_manifestacion',
  'es_portada',
  'fecha_carga',
  'id_usuario_carga',
];

module.exports = { tableName, idColumns, columns };
