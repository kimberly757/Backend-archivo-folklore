const express = require('express');
const router = express.Router();
const controller = require('../controllers/cultoresController');

router.get('/', controller.getAll);
router.get('/:id_cultor', controller.getById);
router.post('/', controller.create);
router.put('/:id_cultor', controller.update);
router.delete('/:id_cultor', controller.delete);

module.exports = { path: '/cultores', router };
