const createController = require('./baseController');
const { tableName, idColumns } = require('../models/multimediaModel');

module.exports = createController(tableName, idColumns);
