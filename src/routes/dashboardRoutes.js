const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const exportController = require('../controllers/exportController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.get('/resumen', requireAuth, requireRole('Administrador'), controller.getResumen);
router.get('/reportes', requireAuth, requireRole('Administrador'), controller.getReportesResumen);

router.get('/exportar/cultores-pdf', requireAuth, requireRole('Administrador'), exportController.exportCultoresPdf);
router.get('/exportar/obras-csv', requireAuth, requireRole('Administrador'), exportController.exportObrasCsv);
router.get('/exportar/catalogo-consolidado-pdf', requireAuth, requireRole('Administrador'), exportController.exportCatalogoConsolidadoPdf);
router.get('/exportar/ficha-cultor/:id_cultor', requireAuth, requireRole('Administrador'), exportController.exportFichaCultorPdf);

module.exports = { path: '/dashboard', router };
