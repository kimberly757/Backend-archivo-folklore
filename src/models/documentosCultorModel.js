const tableName = 'documentos_cultor';
const idColumns = ['id_documento'];
const columns = [
  'id_documento',
  'id_cultor',
  'tipo_documento',
  'url_archivo',
  'nombre_archivo',
  'fecha_carga',
  'id_usuario_carga',
];

module.exports = { tableName, idColumns, columns };
