const express = require('express');
const router = express.Router();
const publicGaleriaController = require('../controllers/publicGaleriaController');

// Obtener la colección de obras públicas
router.get('/coleccion', publicGaleriaController.getGaleriaPublica);

// Obtener la exposición activa
router.get('/exposicion-activa', publicGaleriaController.getExposicionActiva);

module.exports = { path: '/public-galeria', router };
