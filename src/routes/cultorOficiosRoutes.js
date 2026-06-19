const express = require('express');
const router = express.Router();
const controller = require('../controllers/cultorOficiosController');

router.get('/', controller.getAll);
router.get('/:id_cultor/:id_oficio', controller.getById);
router.post('/', controller.create);
router.put('/:id_cultor/:id_oficio', controller.update);
router.delete('/:id_cultor/:id_oficio', controller.delete);

module.exports = { path: '/cultor_oficios', router };
