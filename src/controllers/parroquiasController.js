const createController = require('./baseController');
const { tableName, idColumns } = require('../models/parroquiasModel');

module.exports = createController(tableName, idColumns);
