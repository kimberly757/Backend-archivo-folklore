const createController = require('./baseController');
const { tableName, idColumns } = require('../models/manifestacionesModel');

module.exports = createController(tableName, idColumns);
