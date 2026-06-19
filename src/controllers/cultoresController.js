const createController = require('./baseController');
const { tableName, idColumns } = require('../models/cultoresModel');

module.exports = createController(tableName, idColumns);
