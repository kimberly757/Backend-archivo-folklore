const express = require('express');
const router = express.Router();
const controller = require('../controllers/cultorManifestacionesController');

router.get('/', controller.getAll);
router.get('/:id_cultor/:id_manifestacion', controller.getById);
router.post('/', controller.create);
router.put('/:id_cultor/:id_manifestacion', controller.update);
router.delete('/:id_cultor/:id_manifestacion', controller.delete);

module.exports = { path: '/cultor_manifestaciones', router };
