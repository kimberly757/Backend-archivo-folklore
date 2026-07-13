const { Sequelize } = require('sequelize');
const config = require('./env');

const connectionOptions = {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 20000,
    idle: 10000
  },
  // Reintenta automáticamente queries que fallen por cortes de red transitorios (p.ej. VPN)
  retry: {
    max: 3,
    match: [
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /EHOSTUNREACH/,
      /ENOTFOUND/,
      /ConnectionError/,
      /ConnectionRefusedError/,
      /ConnectionTimedOutError/
    ]
  }
};

// Agregar SSL si está habilitado o si se conecta a Neon/Supabase
const needSsl = config.db.ssl || (config.db.host && config.db.host.includes('neon.tech')) || (config.db.url && config.db.url.includes('sslmode=require'));
if (needSsl) {
  connectionOptions.dialectOptions = {
    // Evita que un intento de conexión se quede colgado indefinidamente si la VPN bloquea Neon
    connectTimeout: 10000,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

let sequelize;

if (config.db.url) {
  let dbUrl = config.db.url;
  if (dbUrl.includes('sslmode=require')) {
    dbUrl = dbUrl.replace('sslmode=require', 'sslmode=verify-full');
  }
  sequelize = new Sequelize(dbUrl, connectionOptions);
} else {
  sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      ...connectionOptions
    }
  );
}

async function testConnection() {
  try {
    // connectTimeout (arriba) cubre el handshake TCP, pero no una resolución DNS
    // colgada (p.ej. sin VPN en redes donde el DNS normal no resuelve Neon) — sin
    // este timeout manual, ese caso se queda esperando para siempre y el ciclo de
    // reintentos de abajo nunca llega a activarse.
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con la base de datos')), 12000)
      ),
    ]);
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Connection error (¿VPN activa bloqueando Neon?):', error.message);
    return false;
  }
}

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
};
