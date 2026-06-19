const express = require('express');
const { tableConfigs } = require('../models/tableConfig');
const crudController = require('../controllers/crudController');

const router = express.Router();

function buildRoutePath(config) {
  const params = config.idColumns.map((column) => `:${column}`).join('/');
  return `/${config.name}/${params}`;
}

tableConfigs.forEach((config) => {
  const basePath = `/${config.name}`;
  const detailPath = buildRoutePath(config);

  router.get(basePath, (req, res) => crudController.getAll(req, res, config));
  router.get(detailPath, (req, res) => crudController.getById(req, res, config));
  router.post(basePath, (req, res) => crudController.createItem(req, res, config));
  router.put(detailPath, (req, res) => crudController.updateItem(req, res, config));
  router.delete(detailPath, (req, res) => crudController.deleteItem(req, res, config));
});

module.exports = router;
