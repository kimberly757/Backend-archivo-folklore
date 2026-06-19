const createController = require('./baseController');
const { tableName, idColumns } = require('../models/documentosCultorModel');

module.exports = createController(tableName, idColumns);
