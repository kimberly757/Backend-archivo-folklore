const tableName = 'exposiciones';
const idColumns = ['id_exposicion'];
const columns = [
  'id_exposicion',
  'nombre_exposicion',
  'descripcion',
  'lugar_fisico',
  'id_parroquia',
  'fecha_inicio',
  'fecha_fin',
  'organizador',
  'es_virtual',
  'url_galeria_virtual',
  'estatus',
  'id_usuario_registro',
];

module.exports = { tableName, idColumns, columns };
