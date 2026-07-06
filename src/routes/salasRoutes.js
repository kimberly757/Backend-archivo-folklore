const express = require('express');
const router = express.Router();
const controller = require('../controllers/salasController');

router.get('/', controller.getAll);
router.get('/:id_sala', controller.getById);
router.get('/:id_sala/obras', controller.getObrasPorSala);
router.post('/', controller.create);
router.put('/:id_sala', controller.update);
router.patch('/:id_sala/estado', controller.cambiarEstado);
router.delete('/:id_sala', controller.delete);

module.exports = { path: '/salas', router };
