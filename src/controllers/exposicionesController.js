const createController = require('./baseController');
const { tableName, idColumns } = require('../models/exposicionesModel');

module.exports = createController(tableName, idColumns);
