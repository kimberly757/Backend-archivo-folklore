// Script de solo lectura para diagnosticar por qué no llegan las notificaciones de
// "obra editada por el cultor" a los administradores.
// Ejecutar: node scratch/diagnostico-notif-admin.js

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

    const [roles] = await sequelize.query(`SELECT id_rol, nombre_rol FROM roles;`);
    console.log('Roles:', roles);

    const rolAdmin = roles.find(r => r.nombre_rol.toLowerCase() === 'administrador');
    if (!rolAdmin) {
      console.log('\nNO se encontró un rol "administrador" (comparando en minúsculas).');
      return;
    }

    const [admins] = await sequelize.query(
      `SELECT id_usuario, correo, activo FROM usuarios WHERE id_rol = ${rolAdmin.id_rol};`
    );
    console.log('\nUsuarios con rol administrador:', admins);

    const activos = admins.filter(a => a.activo === true);
    console.log(`\nDe ${admins.length} administradores, ${activos.length} tienen activo = true.`);

    const [obras] = await sequelize.query(
      `SELECT id_obra, titulo, estatus, id_cultor, codigo_qr_link FROM obras ORDER BY id_obra DESC LIMIT 10;`
    );
    console.log('\nÚltimas 10 obras (estatus actual):', obras);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

main();