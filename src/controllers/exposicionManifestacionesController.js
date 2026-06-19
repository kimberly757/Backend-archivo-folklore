const createController = require('./baseController');
const { tableName, idColumns } = require('../models/exposicionManifestacionesModel');

module.exports = createController(tableName, idColumns);
