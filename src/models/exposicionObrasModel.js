const tableName = 'exposicion_obras';
const idColumns = ['id_exposicion', 'id_obra'];
const columns = [
  'id_exposicion',
  'id_obra',
  'sala',
  'orden_display',
];

module.exports = { tableName, idColumns, columns };
