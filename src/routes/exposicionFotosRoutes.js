const express = require('express');
const router = express.Router();
const controller = require('../controllers/exposicionFotosController');
const upload = require('../middlewares/uploadMiddleware');

router.get('/:id_exposicion', controller.getByExposicion);
router.post('/', upload.array('archivos', 20), controller.upload);
router.delete('/:id_foto', controller.remove);

module.exports = { path: '/exposicion_fotos', router };
