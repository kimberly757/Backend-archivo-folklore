const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriasObraController');

router.get('/', controller.getAll);
router.get('/:id_categoria', controller.getById);
router.post('/', controller.create);
router.put('/:id_categoria', controller.update);
router.delete('/:id_categoria', controller.delete);

module.exports = { path: '/categorias_obra', router };
