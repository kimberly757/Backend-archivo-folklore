// Script de solo lectura: revisa si los cultores autores de las obras 24/25/26 tienen
// parroquia asignada en su propio perfil, y si existen categorías en la BD.
// Ejecutar: node scratch/diagnostico-cultores-categorias.js

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

    const [cultores] = await sequelize.query(`
      SELECT id_cultor, primer_nombre, primer_apellido, id_parroquia
      FROM cultores
      WHERE id_cultor IN (25, 26, 27);
    `);
    console.log('Cultores autores de las obras 24/25/26:');
    console.table(cultores);

    const [categorias] = await sequelize.query(`SELECT id_categoria, nombre FROM categorias_obra ORDER BY id_categoria;`);
    console.log('\nCategorías existentes en la BD:');
    console.table(categorias);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

main();