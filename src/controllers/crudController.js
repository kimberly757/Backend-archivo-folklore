const { findAll, findById, create, update, remove } = require('../models/crudModel');

function getIdValues(req, config) {
  return config.idColumns.map((column) => req.params[column]);
}

async function getAll(req, res, config) {
  try {
    const rows = await findAll(config.name);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros', details: error.message });
  }
}

async function getById(req, res, config) {
  try {
    const idValues = getIdValues(req, config);
    const row = await findById(config.name, config.idColumns, idValues);
    if (!row) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el registro', details: error.message });
  }
}

async function createItem(req, res, config) {
  try {
    const row = await create(config.name, req.body);
    res.status(201).json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el registro', details: error.message });
  }
}

async function updateItem(req, res, config) {
  try {
    const idValues = getIdValues(req, config);
    const row = await update(config.name, req.body, config.idColumns, idValues);
    if (!row) {
      return res.status(404).json({ error: 'Registro no encontrado o no actualizado' });
    }
    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el registro', details: error.message });
  }
}

async function deleteItem(req, res, config) {
  try {
    const idValues = getIdValues(req, config);
    const row = await remove(config.name, config.idColumns, idValues);
    if (!row) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json({ message: 'Registro eliminado', record: row });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el registro', details: error.message });
  }
}

module.exports = {
  getAll,
  getById,
  createItem,
  updateItem,
  deleteItem,
};
