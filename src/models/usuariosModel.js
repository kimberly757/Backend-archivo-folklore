const tableName = 'usuarios';
const idColumns = ['id_usuario'];
const columns = [
  'id_usuario',
  'nombre_completo',
  'correo',
  'password_hash',
  'rol',
  'telefono',
  'activo',
  'fecha_registro',
  'ultimo_acceso',
];

module.exports = { tableName, idColumns, columns };
