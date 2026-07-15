const express = require('express');

const auditoriaRoutes = require('./auditoriaRoutes');
const categoriasObraRoutes = require('./categoriasObraRoutes');
const cultoresRoutes = require('./cultoresRoutes');
const cultorManifestacionesRoutes = require('./cultorManifestacionesRoutes');
const cultorOficiosRoutes = require('./cultorOficiosRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const documentosCultorRoutes = require('./documentosCultorRoutes');
const efemeridesRoutes = require('./efemeridesRoutes');
const exposicionesRoutes = require('./exposicionesRoutes');
const exposicionManifestacionesRoutes = require('./exposicionManifestacionesRoutes');
const exposicionObrasRoutes = require('./exposicionObrasRoutes');
const exposicionFotosRoutes = require('./exposicionFotosRoutes');
const feDeVidaRoutes = require('./feDeVidaRoutes');
const manifestacionesRoutes = require('./manifestacionesRoutes');
const multimediaRoutes = require('./multimediaRoutes');
const municipiosRoutes = require('./municipiosRoutes');
const notificacionesRoutes = require('./notificacionesRoutes');
const obrasRoutes = require('./obrasRoutes');
const oficiosRoutes = require('./oficiosRoutes');
const parroquiasRoutes = require('./parroquiasRoutes');
const reportesRoutes = require('./reportesRoutes');
const sesionesRoutes = require('./sesionesRoutes');
const tiposFolkloreRoutes = require('./tiposFolkloreRoutes');
const usuariosRoutes = require('./usuariosRoutes');
const authRoutes = require('./authRoutes');
const rolesRoutes = require('./rolesRoutes');
const configuracionWebRoutes = require('./configuracionWebRoutes');
const publicGaleriaRoutes = require('./publicGaleriaRoutes');
const statsRoutes = require('./statsRoutes');
const salasRoutes = require('./salasRoutes');

const router = express.Router();

const routeModules = [
  authRoutes,
  rolesRoutes,
  auditoriaRoutes,
  categoriasObraRoutes,
  cultoresRoutes,
  cultorManifestacionesRoutes,
  cultorOficiosRoutes,
  dashboardRoutes,
  documentosCultorRoutes,
  efemeridesRoutes,
  exposicionesRoutes,
  exposicionManifestacionesRoutes,
  exposicionObrasRoutes,
  exposicionFotosRoutes,
  feDeVidaRoutes,
  manifestacionesRoutes,
  multimediaRoutes,
  municipiosRoutes,
  notificacionesRoutes,
  obrasRoutes,
  oficiosRoutes,
  parroquiasRoutes,
  reportesRoutes,
  sesionesRoutes,
  tiposFolkloreRoutes,
  usuariosRoutes,
  publicGaleriaRoutes,
  configuracionWebRoutes,
  statsRoutes,
  salasRoutes,
];

routeModules.forEach((routeModule) => {
  router.use(routeModule.path, routeModule.router);
});

module.exports = router;
