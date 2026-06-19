const express = require('express');
const router = express.Router();
const controller = require('../controllers/obrasController');

router.get('/', controller.getAll);
router.get('/:id_obra', controller.getById);
router.post('/', controller.create);
router.put('/:id_obra', controller.update);
router.delete('/:id_obra', controller.delete);

module.exports = { path: '/obras', router };
