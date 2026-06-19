const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportesController');

router.get('/', controller.getAll);
router.get('/:id_reporte', controller.getById);
router.post('/', controller.create);
router.put('/:id_reporte', controller.update);
router.delete('/:id_reporte', controller.delete);

module.exports = { path: '/reportes', router };
