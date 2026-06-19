const express = require('express');

const auditoriaRoutes = require('./auditoriaRoutes');
const categoriasObraRoutes = require('./categoriasObraRoutes');
const cultoresRoutes = require('./cultoresRoutes');
const cultorManifestacionesRoutes = require('./cultorManifestacionesRoutes');
const cultorOficiosRoutes = require('./cultorOficiosRoutes');
const documentosCultorRoutes = require('./documentosCultorRoutes');
const exposicionesRoutes = require('./exposicionesRoutes');
const exposicionManifestacionesRoutes = require('./exposicionManifestacionesRoutes');
const exposicionObrasRoutes = require('./exposicionObrasRoutes');
const feDeVidaRoutes = require('./feDeVidaRoutes');
const manifestacionesRoutes = require('./manifestacionesRoutes');
const multimediaRoutes = require('./multimediaRoutes');
const municipiosRoutes = require('./municipiosRoutes');
const obrasRoutes = require('./obrasRoutes');
const oficiosRoutes = require('./oficiosRoutes');
const parroquiasRoutes = require('./parroquiasRoutes');
const reportesRoutes = require('./reportesRoutes');
const sesionesRoutes = require('./sesionesRoutes');
const tiposFolkloreRoutes = require('./tiposFolkloreRoutes');
const usuariosRoutes = require('./usuariosRoutes');

const router = express.Router();

const routeModules = [
  auditoriaRoutes,
  categoriasObraRoutes,
  cultoresRoutes,
  cultorManifestacionesRoutes,
  cultorOficiosRoutes,
  documentosCultorRoutes,
  exposicionesRoutes,
  exposicionManifestacionesRoutes,
  exposicionObrasRoutes,
  feDeVidaRoutes,
  manifestacionesRoutes,
  multimediaRoutes,
  municipiosRoutes,
  obrasRoutes,
  oficiosRoutes,
  parroquiasRoutes,
  reportesRoutes,
  sesionesRoutes,
  tiposFolkloreRoutes,
  usuariosRoutes,
];

routeModules.forEach((routeModule) => {
  router.use(routeModule.path, routeModule.router);
});

module.exports = router;
