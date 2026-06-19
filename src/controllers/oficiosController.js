const createController = require('./baseController');
const { tableName, idColumns } = require('../models/oficiosModel');

module.exports = createController(tableName, idColumns);
