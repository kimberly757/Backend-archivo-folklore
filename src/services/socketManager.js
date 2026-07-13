const { Server } = require('socket.io');

// Misma lógica que app.js: localhost para desarrollo + dominios de producción vía
// la variable de entorno ALLOWED_ORIGINS (separados por coma).
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];

let io = null;

function initSocketIO(server) {
  if (io) {
    try { io.close(); } catch (_) {}
    io = null;
  }

  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  console.log('📡 Socket.io inicializado');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocketIO primero.');
  }
  return io;
}

module.exports = { initSocketIO, getIO };
