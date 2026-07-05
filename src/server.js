const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { testConnection, sequelize } = require('./config/database');
const { execSync } = require('child_process');
const { initSocketIO } = require('./services/socketManager');

const port = config.port || 3000;
const DB_RETRY_INTERVAL_MS = 10000;

let retryTimer = null;
let isCheckingConnection = false;
let dbConnected = false;

async function syncDatabase() {
  try {
    await sequelize.sync();
    console.log('✅ Database models synced.');
  } catch (err) {
    console.error('❌ Database sync error:', err.message);
  }
}

async function tryConnectDatabase() {
  if (isCheckingConnection || dbConnected) return;
  isCheckingConnection = true;

  const connected = await testConnection();
  isCheckingConnection = false;

  if (connected) {
    dbConnected = true;
    if (retryTimer) { clearInterval(retryTimer); retryTimer = null; }
    await syncDatabase();
    return;
  }

  if (!retryTimer) {
    console.warn(`⚠️  Sin conexión a la base de datos. Reintentando cada ${DB_RETRY_INTERVAL_MS / 1000}s...`);
    retryTimer = setInterval(tryConnectDatabase, DB_RETRY_INTERVAL_MS);
  }
}

// Mata con netstat el PID exacto que escucha en el puerto, sin errores si no hay nadie
function liberarPuerto(p) {
  if (process.platform !== 'win32') {
    try { execSync(`lsof -ti tcp:${p} | xargs kill -9`); } catch (_) { /* ya libre */ }
    return;
  }
  try {
    // Obtener solo la línea LISTENING y extraer el PID (última columna)
    const salida = execSync(`netstat -ano | findstr ":${p} " | findstr "LISTENING"`, { encoding: 'utf8' });
    const pid = salida.trim().split(/\s+/).at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== '0') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`🔪 Proceso ${pid} en puerto ${p} eliminado.`);
    }
  } catch (_) { /* puerto ya libre, nada que hacer */ }
}

async function startServer(attempt = 0) {
  await tryConnectDatabase();

  const server = http.createServer(app);
  initSocketIO(server);
  server.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });

  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt >= 3) {
        console.error(`❌ No se pudo liberar el puerto ${port} tras 3 intentos. Detenlo manualmente.`);
        process.exit(1);
      }
      console.warn(`⚠️  Puerto ${port} ocupado (intento ${attempt + 1}/3). Liberando...`);
      liberarPuerto(port);
      await new Promise((r) => setTimeout(r, 1200));
      startServer(attempt + 1);
    } else {
      console.error('❌ Error al iniciar el servidor:', err.message);
      process.exit(1);
    }
  });
}

startServer();
