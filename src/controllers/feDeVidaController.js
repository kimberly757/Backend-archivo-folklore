const createController = require('./baseController');
const { tableName, idColumns } = require('../models/feDeVidaModel');

module.exports = createController(tableName, idColumns);
