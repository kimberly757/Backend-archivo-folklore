const express = require('express');
const router = express.Router();
const controller = require('../controllers/exposicionesController');

router.get('/', controller.getAll);
router.get('/:id_exposicion', controller.getById);
router.post('/', controller.create);
router.put('/:id_exposicion', controller.update);
router.delete('/:id_exposicion', controller.delete);

module.exports = { path: '/exposiciones', router };
