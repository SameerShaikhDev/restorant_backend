const Joi = require('joi');

// Validate all environment variables at startup
const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGO_URI: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  TABLE_SESSION_SECRET: Joi.string().min(32).required(),
  FRONTEND_URL: Joi.string().uri().required(),
  ACCESS_TOKEN_EXPIRY: Joi.number().default(900),
  REFRESH_TOKEN_EXPIRY: Joi.number().default(604800),
  TABLE_SESSION_EXPIRY: Joi.number().default(14400),
}).unknown();

const { error, value: env } = envSchema.validate(process.env);

if (error) {
  console.error('❌ Invalid environment variables:', error.message);
  process.exit(1);
}

module.exports = {
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,
  MONGO_URI: env.MONGO_URI,
  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  TABLE_SESSION_SECRET: env.TABLE_SESSION_SECRET,
  FRONTEND_URL: env.FRONTEND_URL,
  ACCESS_TOKEN_EXPIRY: env.ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY: env.REFRESH_TOKEN_EXPIRY,
  TABLE_SESSION_EXPIRY: env.TABLE_SESSION_EXPIRY,
};