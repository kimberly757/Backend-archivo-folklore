const express = require('express');
const router = express.Router();
const { idColumns } = require('../models/auditoriaModel');
const controller = require('../controllers/auditoriaController');

const detailPath = idColumns.map((column) => `:${column}`).join('/');

router.get('/', controller.getAll);
router.get(`/${detailPath}`, controller.getById);
router.post('/', controller.create);
router.put(`/${detailPath}`, controller.update);
router.delete(`/${detailPath}`, controller.delete);

module.exports = { path: '/auditoria', router };
