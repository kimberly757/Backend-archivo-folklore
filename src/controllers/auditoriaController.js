const createController = require('./baseController');
const { tableName, idColumns } = require('../models/auditoriaModel');

module.exports = createController(tableName, idColumns);
