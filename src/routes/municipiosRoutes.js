const express = require('express');
const router = express.Router();
const controller = require('../controllers/municipiosController');

router.get('/', controller.getAll);
router.get('/:id_municipio', controller.getById);
router.post('/', controller.create);
router.put('/:id_municipio', controller.update);
router.delete('/:id_municipio', controller.delete);

module.exports = { path: '/municipios', router };
