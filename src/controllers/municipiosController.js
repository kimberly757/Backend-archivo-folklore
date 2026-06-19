const createController = require('./baseController');
const { tableName, idColumns } = require('../models/municipiosModel');

module.exports = createController(tableName, idColumns);
