const express = require('express');
const router = express.Router();
const controller = require('../controllers/exposicionManifestacionesController');

router.get('/', controller.getAll);
router.get('/:id_exposicion/:id_manifestacion', controller.getById);
router.post('/', controller.create);
router.put('/:id_exposicion/:id_manifestacion', controller.update);
router.delete('/:id_exposicion/:id_manifestacion', controller.delete);

module.exports = { path: '/exposicion_manifestaciones', router };
