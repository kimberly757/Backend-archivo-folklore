const express = require('express');
const router = express.Router();
const controller = require('../controllers/sesionesController');

router.get('/', controller.getAll);
router.get('/:id_sesion', controller.getById);
router.post('/', controller.create);
router.put('/:id_sesion', controller.update);
router.delete('/:id_sesion', controller.delete);

module.exports = { path: '/sesiones', router };
