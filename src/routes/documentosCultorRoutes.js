const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentosCultorController');

router.get('/', controller.getAll);
router.get('/:id_documento', controller.getById);
router.post('/', controller.create);
router.put('/:id_documento', controller.update);
router.delete('/:id_documento', controller.delete);

module.exports = { path: '/documentos_cultor', router };
