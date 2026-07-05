const { Server } = require('socket.io');

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
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
