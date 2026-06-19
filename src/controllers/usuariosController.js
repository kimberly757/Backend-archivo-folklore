const createController = require('./baseController');
const { tableName, idColumns } = require('../models/usuariosModel');

module.exports = createController(tableName, idColumns);
