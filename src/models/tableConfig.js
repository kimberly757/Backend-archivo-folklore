const tableConfigs = [
  { name: 'auditoria', idColumns: ['id_log'] },
  { name: 'categorias_obra', idColumns: ['id_categoria'] },
  { name: 'cultor_manifestaciones', idColumns: ['id_cultor', 'id_manifestacion'] },
  { name: 'cultor_oficios', idColumns: ['id_cultor', 'id_oficio'] },
  { name: 'cultores', idColumns: ['id_cultor'] },
  { name: 'documentos_cultor', idColumns: ['id_documento'] },
  { name: 'exposicion_manifestaciones', idColumns: ['id_exposicion', 'id_manifestacion'] },
  { name: 'exposicion_obras', idColumns: ['id_exposicion', 'id_obra'] },
  { name: 'exposiciones', idColumns: ['id_exposicion'] },
  { name: 'fe_de_vida', idColumns: ['id_fe_vida'] },
  { name: 'manifestaciones_folklore', idColumns: ['id_manifestacion'] },
  { name: 'multimedia', idColumns: ['id_multimedia'] },
  { name: 'municipios', idColumns: ['id_municipio'] },
  { name: 'obras', idColumns: ['id_obra'] },
  { name: 'oficios', idColumns: ['id_oficio'] },
  { name: 'parroquias', idColumns: ['id_parroquia'] },
  { name: 'reportes', idColumns: ['id_reporte'] },
  { name: 'sesiones', idColumns: ['id_sesion'] },
  { name: 'tipos_folklore', idColumns: ['id_tipo_folklore'] },
  { name: 'usuarios', idColumns: ['id_usuario'] },
];

module.exports = { tableConfigs };
