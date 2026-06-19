const tableName = 'sesiones';
const idColumns = ['id_sesion'];
const columns = [
  'id_sesion',
  'id_usuario',
  'token_hash',
  'ip_acceso',
  'fecha_inicio',
  'fecha_expira',
  'activa',
];

module.exports = { tableName, idColumns, columns };
