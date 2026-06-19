const tableName = 'fe_de_vida';
const idColumns = ['id_fe_vida'];
const columns = [
  'id_fe_vida',
  'id_cultor',
  'fecha_control',
  'estatus_confirmado',
  'metodo_verificacion',
  'observaciones',
  'id_usuario_registro',
];

module.exports = { tableName, idColumns, columns };
