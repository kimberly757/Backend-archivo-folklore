const createController = require('./baseController');
const { tableName, idColumns } = require('../models/categoriasObraModel');

module.exports = createController(tableName, idColumns);
