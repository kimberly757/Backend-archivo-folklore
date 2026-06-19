const tableName = 'exposicion_manifestaciones';
const idColumns = ['id_exposicion', 'id_manifestacion'];
const columns = [
  'id_exposicion',
  'id_manifestacion',
  'sala',
  'orden_display',
];

module.exports = { tableName, idColumns, columns };
