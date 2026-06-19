const tableName = 'obras';
const idColumns = ['id_obra'];
const columns = [
  'id_obra',
  'titulo',
  'id_cultor',
  'id_categoria',
  'id_parroquia',
  'tipo_patrimonio',
  'descripcion_historica',
  'materiales_utilizados',
  'dimensiones',
  'peso',
  'tecnica_utilizada',
  'tiempo_ejecucion',
  'significado_cultural',
  'estado_conservacion',
  'ubicacion_actual',
  'valor_estimado',
  'codigo_qr_link',
  'destacado_galeria',
  'estatus',
  'observaciones_admin',
  'id_usuario_registro',
  'fecha_postulacion',
  'fecha_aprobacion',
];

module.exports = { tableName, idColumns, columns };
