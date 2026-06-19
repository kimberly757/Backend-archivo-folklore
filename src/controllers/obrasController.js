const createController = require('./baseController');
const { tableName, idColumns } = require('../models/obrasModel');

module.exports = createController(tableName, idColumns);
