const { z, isoDate, positiveInt } = require('./commonSchemas');

const rolesCreateSchema = z.object({
  nombre_rol: z.string().min(2, 'El nombre del rol debe tener al menos 2 caracteres').max(50),
  descripcion: z.string().max(255).optional().nullable(),
}).strict();

const rolesUpdateSchema = rolesCreateSchema.partial().strict();

const authRegisterSchema = z.object({
  primer_nombre: z.string().min(2, 'El primer nombre debe tener al menos 2 caracteres').max(50),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2, 'El primer apellido debe tener al menos 2 caracteres').max(50),
  segundo_apellido: z.string().max(50).optional().nullable(),
  correo: z.string().email('Debe proporcionar un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  id_rol: positiveInt.optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
}).strict();

const authLoginSchema = z.object({
  correo: z.string().email('Debe proporcionar un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
}).strict();

const usuariosCreateSchema = z.object({
  primer_nombre: z.string().min(2).max(50),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50),
  segundo_apellido: z.string().max(50).optional().nullable(),
  correo: z.string().email(),
  password: z.string().min(8).optional(),
  id_rol: positiveInt.optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
}).strict();

const usuariosUpdateSchema = usuariosCreateSchema.partial().strict();

const cultoresCreateSchema = z.object({
  id_usuario: positiveInt.optional().nullable(),
  cedula: z.string().min(5).max(15),
  primer_nombre: z.string().min(2).max(50),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50),
  segundo_apellido: z.string().max(50).optional().nullable(),
  fecha_nacimiento: isoDate.optional().nullable(),
  genero: z.string().max(10).optional().nullable(),
  telefono_contacto: z.string().max(20).optional().nullable(),
  correo_contacto: z.string().email().optional().nullable(),
  direccion_residencia: z.string().optional().nullable(),
  id_parroquia: positiveInt.optional().nullable(),
  resumen_curricular: z.string().optional().nullable(),
  trayectoria_documentada: z.string().optional().nullable(),
  estatus_vida: z.string().max(20).optional().nullable(),
  esta_certificado: z.boolean().optional(),
  foto_perfil: z.string().max(255).optional().nullable(),
  foto_certificacion: z.string().max(255).optional().nullable(),
  datos_censo_adicionales: z.any().optional(),
}).strict();

const cultoresUpdateSchema = cultoresCreateSchema.partial().strict();

const obrasCreateSchema = z.object({
  titulo: z.string().min(2).max(150),
  id_cultor: positiveInt,
  id_categoria: positiveInt.optional().nullable(),
  id_parroquia: positiveInt.optional().nullable(),
  tipo_patrimonio: z.string().max(50).optional().nullable(),
  descripcion_historica: z.string().optional().nullable(),
  materiales_utilizados: z.string().max(255).optional().nullable(),
  dimensiones: z.string().max(50).optional().nullable(),
  peso: z.coerce.number().optional().nullable(),
  tecnica_utilizada: z.string().max(100).optional().nullable(),
  tiempo_ejecucion: z.string().max(50).optional().nullable(),
  significado_cultural: z.string().optional().nullable(),
  estado_conservacion: z.string().max(50).optional().nullable(),
  ubicacion_actual: z.string().max(150).optional().nullable(),
  valor_estimado: z.coerce.number().optional().nullable(),
  codigo_qr_link: z.string().max(255).optional().nullable(),
  destacado_galeria: z.boolean().optional(),
  estatus: z.string().max(20).optional().nullable(),
  observaciones_admin: z.string().optional().nullable(),
  id_usuario_registro: positiveInt.optional().nullable(),
  fecha_postulacion: isoDate.optional().nullable(),
  fecha_aprobacion: isoDate.optional().nullable(),
}).strict();

const obrasUpdateSchema = obrasCreateSchema.partial().strict();

const manifestacionesCreateSchema = z.object({
  id_tipo_folklore: positiveInt,
  nombre: z.string().min(2).max(150),
  descripcion: z.string().optional().nullable(),
  id_parroquia: positiveInt.optional().nullable(),
  origen_historico: z.string().optional().nullable(),
  vigencia_actual: z.string().max(50).optional().nullable(),
  observaciones: z.string().optional().nullable(),
  estatus: z.string().max(20).optional().nullable(),
  id_usuario_registro: positiveInt.optional().nullable(),
}).strict();

const manifestacionesUpdateSchema = manifestacionesCreateSchema.partial().strict();

const forgotPasswordSchema = z.object({
  correo: z.string().email('Debe proporcionar un correo electrónico válido'),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(128),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(128),
}).strict();

const updateProfileSchema = z.object({
  primer_nombre: z.string().min(2).max(50).optional(),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50).optional(),
  segundo_apellido: z.string().max(50).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  correo: z.string().email().optional(),
}).strict();

module.exports = {
  authRegisterSchema,
  authLoginSchema,
  usuariosCreateSchema,
  usuariosUpdateSchema,
  cultoresCreateSchema,
  cultoresUpdateSchema,
  obrasCreateSchema,
  obrasUpdateSchema,
  manifestacionesCreateSchema,
  manifestacionesUpdateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  rolesCreateSchema,
  rolesUpdateSchema,
};
