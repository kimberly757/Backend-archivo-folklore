const { z, isoDate, positiveInt, passwordSegura } = require('./commonSchemas');

// Acepta boolean real (JSON) o "true"/"false" en texto (multipart/form-data, usado por
// cultores al ir la cédula/soportes como archivos, y por efemérides al subir imagen).
const booleanoDeFormulario = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

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
  password: passwordSegura,
  id_rol: positiveInt.optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
}).strict();

const authLoginSchema = z.object({
  correo: z.string().email('Debe proporcionar un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  // Indica desde qué app se inicia sesión ('publico' = sitio del cultor, 'admin' =
  // panel administrativo), para elegir la cuenta correcta cuando el mismo correo
  // tiene una cuenta de cada rol. Opcional por compatibilidad con clientes viejos.
  portal: z.enum(['publico', 'admin']).optional(),
}).strict();

const usuariosCreateSchema = z.object({
  primer_nombre: z.string().min(2).max(50),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50),
  segundo_apellido: z.string().max(50).optional().nullable(),
  correo: z.string().email(),
  password: passwordSegura.optional(),
  id_rol: positiveInt.optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
}).strict();

const usuariosUpdateSchema = usuariosCreateSchema.partial().strict();

const cultoresBaseSchema = z.object({
  id_usuario: positiveInt.optional().nullable(),
  // Formato exigido por el selector V-/E- del frontend (ManualCultorForm.jsx, RegisterForm.jsx):
  // letra + guion + 6 a 9 dígitos. Ej. V-12345678
  cedula: z.string().regex(/^[VE]-\d{6,9}$/, 'Formato esperado: V-12345678 o E-12345678'),
  seudonimo: z.string().max(100).optional().nullable(),
  primer_nombre: z.string().min(2).max(50),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50),
  segundo_apellido: z.string().max(50).optional().nullable(),
  fecha_nacimiento: isoDate.optional().nullable(),
  genero: z.string().max(10).optional().nullable(),
  // Formato exigido por el selector de prefijo del frontend: prefijo venezolano válido +
  // guion + 7 dígitos. Ej. 0414-1234567
  telefono_contacto: z.string()
    .regex(/^(0414|0424|0416|0426|0412|0422|0276)-\d{7}$/, 'Formato esperado: 0414-1234567 (prefijo venezolano válido + 7 dígitos)')
    .optional()
    .nullable(),
  correo_contacto: z.string().email().optional().nullable(),
  direccion_residencia: z.string().optional().nullable(),
  id_parroquia: positiveInt.optional().nullable(),
  resumen_curricular: z.string().optional().nullable(),
  trayectoria_documentada: z.string().optional().nullable(),
  estatus_vida: z.string().max(20).optional().nullable(),
  esta_certificado: booleanoDeFormulario.optional(),
  foto_perfil: z.string().max(255).optional().nullable(),
  foto_certificacion: z.string().max(255).optional().nullable(),
  datos_censo_adicionales: z.any().optional(),
}).strict();

const cultoresCreateSchema = cultoresBaseSchema.superRefine((data, ctx) => {
  if (data.fecha_nacimiento) {
    const edad = Math.floor((Date.now() - new Date(data.fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (edad < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes tener al menos 12 años de edad para registrarte.',
        path: ['fecha_nacimiento'],
      });
    }
  }
});

const cultoresUpdateSchema = cultoresBaseSchema.partial().strict().superRefine((data, ctx) => {
  if (data.fecha_nacimiento) {
    const edad = Math.floor((Date.now() - new Date(data.fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (edad < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes tener al menos 12 años de edad para registrarte.',
        path: ['fecha_nacimiento'],
      });
    }
  }
});

// Efemérides culturales: día/mes recurrente (se repite cada año), año histórico de
// referencia opcional. "activa" controla si aparece en la web pública.
const efemeridesCreateSchema = z.object({
  titulo: z.string().min(2).max(150),
  descripcion: z.string().optional().nullable(),
  dia: z.coerce.number().int().min(1).max(31),
  mes: z.coerce.number().int().min(1).max(12),
  anio_referencia: z.coerce.number().int().min(1, 'Año inválido').max(2100).optional().nullable(),
  categoria: z.string().max(50).optional().nullable(),
  imagen: z.string().max(2048).optional().nullable(),
  activa: booleanoDeFormulario.optional(),
}).strict();

const efemeridesUpdateSchema = efemeridesCreateSchema.partial().strict();

const estatusSchema = z.object({
  estatus: z.enum(['pendiente', 'aprobado', 'rechazado']),
  ubicacion_actual: z.string().max(150).optional().nullable(),
}).strict();

// Campos de control de aprobación (estatus, observaciones_admin, fecha_aprobacion,
// id_usuario_registro) quedan FUERA de este esquema a propósito: el cliente que crea
// una obra (visitante o cultor) nunca debe poder fijarlos; los asigna el servidor.
const obrasCreateSchema = z.object({
  titulo: z.string().min(2).max(150),
  id_cultor: positiveInt.optional().nullable(),
  id_categoria: positiveInt.optional().nullable(),
  id_parroquia: positiveInt.optional().nullable(),
  tipo_patrimonio: z.string().max(50).optional().nullable(),
  descripcion_historica: z.string().optional().nullable(),
  materiales_utilizados: z.string().max(255).optional().nullable(),
  dimensiones: z.string().max(50).optional().nullable(),
  peso: z.coerce.number().min(0, 'El peso no puede ser negativo').optional().nullable(),
  tecnica_utilizada: z.string().max(100).optional().nullable(),
  tiempo_ejecucion: z.string().max(50).optional().nullable(),
  anio_creacion: z.coerce.number().int().min(1900, 'Año inválido').max(new Date().getFullYear(), 'El año de creación no puede ser futuro').optional().nullable(),
  significado_cultural: z.string().optional().nullable(),
  estado_conservacion: z.string().max(50).optional().nullable(),
  ubicacion_actual: z.string().max(150).optional().nullable(),
  valor_estimado: z.coerce.number().optional().nullable(),
  codigo_qr_link: z.string().max(255).optional().nullable(),
  destacado_galeria: z.boolean().optional(),
}).strict();

// El admin sí puede tocar estos campos vía PUT (todo menos el estatus, que tiene su
// propio PATCH dedicado para mantener ese cambio auditable y separado).
const obrasUpdateSchema = obrasCreateSchema.partial().extend({
  observaciones_admin: z.string().optional().nullable(),
}).strict();

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
  // Mismo uso que en authLoginSchema: el correo puede pertenecer a una cuenta de
  // cultor y otra de administrador a la vez (unique por correo+id_rol), así que hay
  // que saber desde qué portal se pide la recuperación para tocar la cuenta correcta.
  portal: z.enum(['publico', 'admin']).optional(),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  newPassword: passwordSegura,
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSegura,
}).strict();

const updateProfileSchema = z.object({
  primer_nombre: z.string().min(2).max(50).optional(),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50).optional(),
  segundo_apellido: z.string().max(50).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  correo: z.string().email().optional(),
}).strict();

// Esquema para que el cultor actualice sus propios datos personales (PATCH /mi-perfil).
// Solo permite los camposde información personal seguros — nunca estatus, id_usuario, etc.
const cultoresMiPerfilUpdateSchema = z.object({
  primer_nombre: z.string().min(2).max(50).optional(),
  segundo_nombre: z.string().max(50).optional().nullable(),
  primer_apellido: z.string().min(2).max(50).optional(),
  segundo_apellido: z.string().max(50).optional().nullable(),
  seudonimo: z.string().max(100).optional().nullable(),
  fecha_nacimiento: isoDate.optional().nullable(),
  genero: z.string().max(10).optional().nullable(),
  telefono_contacto: z.string()
    .regex(/^(0414|0424|0416|0426|0412|0422|0276)-\d{7}$/, 'Formato esperado: 0414-1234567')
    .optional()
    .nullable(),
  correo_contacto: z.string().email().optional().nullable(),
  direccion_residencia: z.string().optional().nullable(),
  id_parroquia: positiveInt.optional().nullable(),
  resumen_curricular: z.string().optional().nullable(),
  trayectoria_documentada: z.string().optional().nullable(),
  esta_certificado: z.boolean().optional(),
  mostrar_contacto_publico: z.boolean().optional(),
}).strict();

// Esquema para agregar texto al resumen curricular (appending).
const appendCurriculumSchema = z.object({
  texto: z.string().min(1, 'El texto a agregar no puede estar vacío').max(5000),
}).strict();

module.exports = {
  authRegisterSchema,
  authLoginSchema,
  usuariosCreateSchema,
  usuariosUpdateSchema,
  cultoresCreateSchema,
  cultoresUpdateSchema,
  cultoresMiPerfilUpdateSchema,
  appendCurriculumSchema,
  efemeridesCreateSchema,
  efemeridesUpdateSchema,
  obrasCreateSchema,
  obrasUpdateSchema,
  estatusSchema,
  manifestacionesCreateSchema,
  manifestacionesUpdateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  rolesCreateSchema,
  rolesUpdateSchema,
};
