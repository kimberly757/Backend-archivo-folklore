const express = require('express');
const router = express.Router();
const controller = require('../controllers/oficiosController');

router.get('/', controller.getAll);
router.get('/:id_oficio', controller.getById);
router.post('/', controller.create);
router.put('/:id_oficio', controller.update);
router.delete('/:id_oficio', controller.delete);

module.exports = { path: '/oficios', router };
