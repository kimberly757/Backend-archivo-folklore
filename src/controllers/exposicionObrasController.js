const createController = require('./baseController');
const { tableName, idColumns } = require('../models/exposicionObrasModel');

module.exports = createController(tableName, idColumns);
