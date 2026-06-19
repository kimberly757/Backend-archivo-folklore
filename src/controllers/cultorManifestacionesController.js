const createController = require('./baseController');
const { tableName, idColumns } = require('../models/cultorManifestacionesModel');

module.exports = createController(tableName, idColumns);
