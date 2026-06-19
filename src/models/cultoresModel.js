const tableName = 'cultores';
const idColumns = ['id_cultor'];
const columns = [
  'id_cultor',
  'id_usuario',
  'cedula',
  'nombres',
  'apellidos',
  'fecha_nacimiento',
  'genero',
  'telefono_contacto',
  'correo_contacto',
  'direccion_residencia',
  'id_parroquia',
  'resumen_curricular',
  'trayectoria_documentada',
  'estatus_vida',
  'esta_certificado',
  'foto_perfil',
  'foto_certificacion',
  'datos_censo_adicionales',
  'fecha_registro',
  'fecha_ultima_actualizacion',
];

module.exports = { tableName, idColumns, columns };
