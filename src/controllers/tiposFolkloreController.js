const createController = require('./baseController');
const { tableName, idColumns } = require('../models/tiposFolkloreModel');

module.exports = createController(tableName, idColumns);
