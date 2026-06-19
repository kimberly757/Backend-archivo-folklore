const createController = require('./baseController');
const { tableName, idColumns } = require('../models/cultorOficiosModel');

module.exports = createController(tableName, idColumns);
