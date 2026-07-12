// Script de solo lectura para revisar si id_categoria / id_parroquia están quedando en
// NULL en obras recientes, y desde cuándo.
// Ejecutar: node scratch/diagnostico-obras-categoria-parroquia.js

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL || (
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  );

  const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: DATABASE_URL.includes('localhost') ? false : { require: true, rejectUnauthorized: false },
    },
  });

  try {
    await sequelize.authenticate();
    console.log('Conectado a la BD\n');

    const [obras] = await sequelize.query(`
      SELECT id_obra, titulo, estatus, id_cultor, id_categoria, id_parroquia, fecha_postulacion
      FROM obras
      ORDER BY id_obra DESC
      LIMIT 10;
    `);
    console.log('Últimas 10 obras (id_categoria / id_parroquia / fecha):');
    console.table(obras);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

main();