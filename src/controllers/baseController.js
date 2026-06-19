const { findAll, findById, create: createRecord, update: updateRecord, remove: removeRecord } = require('../models/crudModel');

function getIdValues(req, idColumns) {
  return idColumns.map((column) => req.params[column]);
}

function createController(tableName, idColumns) {
  async function getAll(req, res) {
    try {
      const rows = await findAll(tableName);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los registros', details: error.message });
    }
  }

  async function getById(req, res) {
    try {
      const idValues = getIdValues(req, idColumns);
      const row = await findById(tableName, idColumns, idValues);
      if (!row) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }
      res.json(row);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el registro', details: error.message });
    }
  }

  async function create(req, res) {
    try {
      const row = await createRecord(tableName, req.body);
      res.status(201).json(row);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el registro', details: error.message });
    }
  }

  async function update(req, res) {
    try {
      const idValues = getIdValues(req, idColumns);
      const row = await updateRecord(tableName, req.body, idColumns, idValues);
      if (!row) {
        return res.status(404).json({ error: 'Registro no encontrado o no actualizado' });
      }
      res.json(row);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el registro', details: error.message });
    }
  }

  async function deleteItem(req, res) {
    try {
      const idValues = getIdValues(req, idColumns);
      const row = await removeRecord(tableName, idColumns, idValues);
      if (!row) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }
      res.json({ message: 'Registro eliminado', record: row });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el registro', details: error.message });
    }
  }

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteItem,
  };
}

module.exports = createController;
