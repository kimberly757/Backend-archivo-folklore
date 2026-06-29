const express = require('express');
const router = express.Router();
const configuracionWebController = require('../controllers/configuracionWebController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Obtener la configuración web (Ruta pública para el portal)
router.get('/', configuracionWebController.get);

// Actualizar la configuración web (Protegida)
router.put('/', requireAuth, requireRole('Administrador'), configuracionWebController.update);

module.exports = { path: '/configuracion-web', router };
