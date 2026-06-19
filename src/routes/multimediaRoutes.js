const express = require('express');
const router = express.Router();
const controller = require('../controllers/multimediaController');

router.get('/', controller.getAll);
router.get('/:id_multimedia', controller.getById);
router.post('/', controller.create);
router.put('/:id_multimedia', controller.update);
router.delete('/:id_multimedia', controller.delete);

module.exports = { path: '/multimedia', router };
