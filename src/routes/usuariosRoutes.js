const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuariosController');

router.get('/', controller.getAll);
router.get('/:id_usuario', controller.getById);
router.post('/', controller.create);
router.put('/:id_usuario', controller.update);
router.delete('/:id_usuario', controller.delete);

module.exports = { path: '/usuarios', router };
