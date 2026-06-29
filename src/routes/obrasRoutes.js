const express = require('express');
const router = express.Router();
const controller = require('../controllers/obrasController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { validateZod } = require('../middlewares/validateZod');
const { makeParamIdSchema } = require('../validators/commonSchemas');
const { obrasCreateSchema, obrasUpdateSchema, estatusSchema } = require('../validators/domainSchemas');

// Ruta pública (sin auth): la web pública solo ve obras ya aprobadas.
// Debe declararse ANTES de '/:id_obra' para que Express no la confunda con un id.
router.get('/publico', controller.getPublico);

// Rutas administrativas de lectura (acepta ?estatus= para filtrar, ver controller)
router.get('/', requireAuth, controller.getAll);
router.get('/:id_obra', requireAuth, validateZod({ params: makeParamIdSchema('id_obra') }), controller.getById);

// Postulación de una obra: requiere sesión (cultor o admin); el estatus queda 'pendiente' por default en BD
router.post('/', requireAuth, validateZod({ body: obrasCreateSchema }), controller.create);

// Rutas de escritura protegidas (gestión administrativa)
router.put('/:id_obra', requireAuth, validateZod({ params: makeParamIdSchema('id_obra'), body: obrasUpdateSchema }), controller.update);
router.patch('/:id_obra/estatus', requireAuth, requireRole('Administrador'), validateZod({ params: makeParamIdSchema('id_obra'), body: estatusSchema }), controller.updateEstatus);
router.patch('/:id_obra/destacado', requireAuth, requireRole('Administrador'), controller.updateDestacado);
router.delete('/:id_obra', requireAuth, validateZod({ params: makeParamIdSchema('id_obra') }), controller.delete);

module.exports = { path: '/obras', router };
