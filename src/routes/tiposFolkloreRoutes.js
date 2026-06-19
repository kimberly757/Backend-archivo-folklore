const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiposFolkloreController');

router.get('/', controller.getAll);
router.get('/:id_tipo', controller.getById);
router.post('/', controller.create);
router.put('/:id_tipo', controller.update);
router.delete('/:id_tipo', controller.delete);

module.exports = { path: '/tipos_folklore', router };
