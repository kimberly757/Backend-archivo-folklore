const tableName = 'reportes';
const idColumns = ['id_reporte'];
const columns = [
  'id_reporte',
  'titulo',
  'tipo_reporte',
  'parametros_filtro',
  'url_archivo',
  'id_usuario_genera',
  'fecha_generacion',
];

module.exports = { tableName, idColumns, columns };
