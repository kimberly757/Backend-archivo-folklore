const express = require('express');
const router = express.Router();
const controller = require('../controllers/feDeVidaController');

router.get('/', controller.getAll);
router.get('/:id_fe_vida', controller.getById);
router.post('/', controller.create);
router.put('/:id_fe_vida', controller.update);
router.delete('/:id_fe_vida', controller.delete);

module.exports = { path: '/fe_de_vida', router };
