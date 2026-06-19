const tableName = 'tipos_folklore';
const idColumns = ['id_tipo_folklore'];
const columns = [
  'id_tipo_folklore',
  'tipo',
  'nombre',
  'descripcion',
  'id_parroquia',
];

module.exports = { tableName, idColumns, columns };
