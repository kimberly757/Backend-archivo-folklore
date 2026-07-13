const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('../src/config/database');

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Ejecutar el query de alteración de tabla
    // En PostgreSQL de Neon/Supabase, usamos ADD COLUMN IF NOT EXISTS
    await sequelize.query('ALTER TABLE configuracion_web ADD COLUMN IF NOT EXISTS contacto_horario TEXT;');
    
    console.log('✅ Columna contacto_horario agregada o ya existente en la tabla configuracion_web.');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada.');
  }
}

migrate();
