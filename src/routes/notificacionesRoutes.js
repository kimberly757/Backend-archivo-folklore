const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificacionesController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.get('/', requireAuth, controller.getAll);
router.put('/marcar-leidas', requireAuth, controller.marcarLeidas);
router.patch('/:id/leer', requireAuth, controller.marcarUnaLeida);

module.exports = { path: '/notificaciones', router };
