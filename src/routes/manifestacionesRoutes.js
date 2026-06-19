const express = require('express');
const router = express.Router();
const controller = require('../controllers/manifestacionesController');

router.get('/', controller.getAll);
router.get('/:id_manifestacion', controller.getById);
router.post('/', controller.create);
router.put('/:id_manifestacion', controller.update);
router.delete('/:id_manifestacion', controller.delete);

module.exports = { path: '/manifestaciones', router };
