const express = require('express');
const router = express.Router();
const controller = require('../controllers/cultoresController');
const { requireAuth, requireRole, requireOwnCultorOrAdmin, requireActivo } = require('../middlewares/authMiddleware');
const { validateZod } = require('../middlewares/validateZod');
const { makeParamIdSchema } = require('../validators/commonSchemas');
const { cultoresCreateSchema, cultoresUpdateSchema, cultoresMiPerfilUpdateSchema, appendCurriculumSchema, estatusSchema } = require('../validators/domainSchemas');
const upload = require('../middlewares/uploadMiddleware');

// Ruta pública (sin auth): la web pública solo ve cultores ya aprobados.
// Debe declararse ANTES de '/:id_cultor' para que Express no la confunda con un id.
router.get('/publico', controller.getPublico);

// Perfil del cultor logueado (requireAuth, sin requireRole: cualquier cultor puede ver
// el suyo). También debe ir ANTES de '/:id_cultor' por la misma razón.
router.get('/perfil', requireAuth, controller.getMiPerfil);

// Rutas administrativas de lectura (acepta ?estatus= para filtrar, ver controller)
router.get('/', requireAuth, controller.getAll);
router.get('/:id_cultor', requireAuth, validateZod({ params: makeParamIdSchema('id_cultor') }), controller.getById);

// Postulación pública: un visitante anónimo crea su propio registro (queda 'pendiente' por default en BD)
router.post('/', validateZod({ body: cultoresCreateSchema }), controller.create);

// Ingreso manual del admin: crea el cultor YA aprobado + su Usuario/contraseña en la
// misma llamada. Protegido y solo para administradores — nunca público, porque permite
// auto-aprobación inmediata (al contrario de POST '/', que siempre queda 'pendiente').
router.post('/ingreso-manual', requireAuth, requireRole('administrador'), validateZod({ body: cultoresCreateSchema }), controller.ingresoManual);

// Autoservicio del cultor: editar su propio perfil y agregar items al currículum.
// requireOwnCultorOrAdmin verifica que sea el dueño del registro o un admin.
// requireActivo bloquea a cultores inactivos (el admin siempre pasa).
router.patch('/mi-perfil', requireAuth, requireActivo, requireOwnCultorOrAdmin, validateZod({ body: cultoresMiPerfilUpdateSchema }), controller.updateMiPerfil);
router.patch('/mi-perfil/curriculum', requireAuth, requireActivo, requireOwnCultorOrAdmin, validateZod({ body: appendCurriculumSchema }), controller.appendCurriculum);
router.post('/subir-foto', requireAuth, requireActivo, upload.single('archivo'), controller.subirFoto);

// Rutas de escritura protegidas (gestión administrativa)
router.put('/:id_cultor', requireAuth, requireRole('administrador'), validateZod({ params: makeParamIdSchema('id_cultor'), body: cultoresUpdateSchema }), controller.update);
router.patch('/:id_cultor/estatus', requireAuth, requireRole('administrador'), validateZod({ params: makeParamIdSchema('id_cultor'), body: estatusSchema }), controller.updateEstatus);
router.patch('/:id_cultor/activar', requireAuth, requireRole('administrador'), validateZod({ params: makeParamIdSchema('id_cultor') }), controller.toggleActivo);
router.delete('/:id_cultor', requireAuth, validateZod({ params: makeParamIdSchema('id_cultor') }), controller.delete);

module.exports = { path: '/cultores', router };
