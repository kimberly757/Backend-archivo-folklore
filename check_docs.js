const { Cultores, DocumentosCultor, sequelize } = require('./src/models');
async function main() {
  const all = await Cultores.findAll({ order: [['id_cultor', 'DESC']], limit: 15, attributes: ['id_cultor', 'cedula', 'primer_nombre', 'estatus', 'fecha_registro'] });
  console.log('=== ÚLTIMOS CULTORES ===');
  all.forEach(c => console.log(`  id=${c.id_cultor}, cedula=${c.cedula}, nombre=${c.primer_nombre}, estatus=${c.estatus}, fecha=${c.fecha_registro}`));
  
  const docs = await DocumentosCultor.findAll({ order: [['id_documento', 'DESC']], limit: 15 });
  console.log('\n=== ÚLTIMOS DOCUMENTOS ===');
  docs.forEach(d => console.log(`  id=${d.id_documento}, id_cultor=${d.id_cultor}, tipo=${d.tipo_documento}, url=${d.url_archivo?.substring(0,60)}`));
  
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
