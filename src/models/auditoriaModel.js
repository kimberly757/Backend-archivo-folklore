const tableName = 'auditoria';
const idColumns = ['id_log'];
const columns = [
  'id_log',
  'id_usuario',
  'accion',
  'tabla_afectada',
  'id_registro',
  'datos_anteriores',
  'datos_nuevos',
  'ip_origen',
  'fecha_hora',
];

module.exports = { tableName, idColumns, columns };
