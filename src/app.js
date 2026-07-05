const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { getIO } = require('./services/socketManager');

const app = express();

// Middlewares de seguridad y logs
app.use(helmet());
// Orígenes permitidos: la web pública (vite-project) y el dashboard administrativo
// (frontend_archivo). Ambos corren con Vite en modo dev y por defecto usan el puerto
// 5173 — si los dos están abiertos al mismo tiempo, Vite asigna 5174 al segundo.
// Se listan ambos puertos para cubrir cualquiera de los dos casos.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));

// Parsear cuerpo de peticiones
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: true }));

// Documentación de API interactiva Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Emitir evento socket tras cualquier mutación exitosa en la API.
// Debe ir ANTES de las rutas para que el 'finish' se registre a tiempo.
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try { getIO().emit('admin:update', {}); } catch (_) {}
      }
    });
  }
  next();
});

// Rutas de la API
app.use('/api', routes);

// Middleware para rutas inexistentes
app.use(notFound);

// Manejador centralizado de errores
app.use(errorHandler);

module.exports = app;
