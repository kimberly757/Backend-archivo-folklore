const express = require('express');
const router = express.Router();
const controller = require('../controllers/exposicionObrasController');

router.get('/', controller.getAll);
router.get('/:id_exposicion/:id_obra', controller.getById);
router.post('/', controller.create);
router.put('/:id_exposicion/:id_obra', controller.update);
router.delete('/:id_exposicion/:id_obra', controller.delete);

module.exports = { path: '/exposicion_obras', router };
