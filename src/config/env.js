const Joi = require('joi');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  
  // Base de datos - PostgreSQL
  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().optional(),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_SSL: Joi.boolean().default(false),
  
  // Dialecto de base de datos preferido
  DB_DIALECT: Joi.string().valid('postgres', 'sqlite').default('sqlite'),

  // Seguridad
  JWT_SECRET: Joi.string().default('secret_key_default_archivo_folklore_12345'),
  JWT_EXPIRATION: Joi.string().default('24h'),

  // Correo SMTP (opcional para desarrollo)
  EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().allow('').optional(),
  EMAIL_PASS: Joi.string().allow('').optional(),
}).unknown();

const { value: envVars, error } = schema.validate(process.env);

if (error) {
  console.error('❌ Error de validación en variables de entorno:', error.message);
  throw new Error(`Error de validación de configuración: ${error.message}`);
}

// Determinar dialecto dinámicamente si hay variables de postgres
let activeDialect = envVars.DB_DIALECT;
if (envVars.DATABASE_URL || (envVars.DB_HOST && envVars.DB_NAME && envVars.DB_USER)) {
  activeDialect = 'postgres';
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  dbDialect: activeDialect,
  db: {
    dialect: activeDialect,
    url: envVars.DATABASE_URL,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    ssl: envVars.DB_SSL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRATION,
  },
  email: {
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    secure: envVars.EMAIL_SECURE,
    user: envVars.EMAIL_USER,
    pass: envVars.EMAIL_PASS,
  }
};
