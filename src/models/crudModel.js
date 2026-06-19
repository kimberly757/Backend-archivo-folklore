const pool = require('../config/db');

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildWhereClause(idColumns) {
  return idColumns.map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`).join(' AND ');
}

function buildSetClause(data, offset = 1) {
  return Object.keys(data)
    .map((column, index) => `${quoteIdentifier(column)} = $${index + offset}`)
    .join(', ');
}

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function findAll(table) {
  const sql = `SELECT * FROM ${quoteIdentifier(table)} ORDER BY 1`;
  return query(sql);
}

async function findById(table, idColumns, idValues) {
  const sql = `SELECT * FROM ${quoteIdentifier(table)} WHERE ${buildWhereClause(idColumns)}`;
  const rows = await query(sql, idValues);
  return rows[0] || null;
}

async function create(table, data) {
  const columns = Object.keys(data);
  if (columns.length === 0) {
    throw new Error('No data provided for insert');
  }

  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const sql = `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const rows = await query(sql, values);
  return rows[0];
}

async function update(table, data, idColumns, idValues) {
  const updateData = { ...data };
  idColumns.forEach((column) => {
    delete updateData[column];
  });

  const columns = Object.keys(updateData);
  if (columns.length === 0) {
    throw new Error('No update data provided');
  }

  const values = Object.values(updateData);
  const sql = `UPDATE ${quoteIdentifier(table)} SET ${buildSetClause(updateData)} WHERE ${buildWhereClause(idColumns)} RETURNING *`;
  const rows = await query(sql, [...values, ...idValues]);
  return rows[0] || null;
}

async function remove(table, idColumns, idValues) {
  const sql = `DELETE FROM ${quoteIdentifier(table)} WHERE ${buildWhereClause(idColumns)} RETURNING *`;
  const rows = await query(sql, idValues);
  return rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
