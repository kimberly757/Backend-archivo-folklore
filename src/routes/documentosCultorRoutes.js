const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentosCultorController');
const upload = require('../middlewares/uploadMiddleware');
const { requireAuth } = require('../middlewares/authMiddleware');

// Sin requireAuth a propósito: la postulación pública (RegisterForm.jsx, vite-project)
// crea el cultor SIN sesión, así que tampoco hay token disponible para subir su cédula
// justo después. Mismo nivel de exposición que POST /cultores (también pública). El
// ingreso manual desde el dashboard sí envía su token, pero el backend no lo exige aquí.
router.get('/', controller.getAll);
router.get('/mis-documentos', requireAuth, controller.getMisDocumentos);
router.delete('/mis-documentos/:id_documento', requireAuth, controller.deleteMisDocumentos);
router.get('/:id_documento', controller.getById);
router.post('/', controller.create);
router.post('/validar-cedula', upload.single('archivo'), controller.validarCedulaImagen);
router.post('/cedula', upload.single('archivo'), controller.uploadCedula);
router.post('/subir-soporte', upload.array('archivos', 10), controller.uploadSoporte);
router.put('/:id_documento', controller.update);
router.delete('/:id_documento', controller.delete);

module.exports = { path: '/documentos_cultor', router };
