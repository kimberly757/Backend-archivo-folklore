const createController = require('./baseController');
const { tableName, idColumns } = require('../models/sesionesModel');

module.exports = createController(tableName, idColumns);
