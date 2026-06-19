const createController = require('./baseController');
const { tableName, idColumns } = require('../models/reportesModel');

module.exports = createController(tableName, idColumns);
