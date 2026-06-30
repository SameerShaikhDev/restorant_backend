const Joi = require('joi');

const createTableSchema = Joi.object({
  tableNumber: Joi.string()
    .required()
    .trim()
    .pattern(/^[A-Za-z0-9-]+$/),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(4),
  floorSection: Joi.string()
    .trim()
    .default('Main'),
  status: Joi.string()
    .valid('available', 'occupied', 'reserved', 'cleaning')
    .default('available'),
});

const updateTableSchema = Joi.object({
  tableNumber: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9-]+$/),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(20),
  floorSection: Joi.string()
    .trim(),
  status: Joi.string()
    .valid('available', 'occupied', 'reserved', 'cleaning'),
  reservedUntil: Joi.date(),
  reservedFor: Joi.string()
    .trim()
    .max(100),
});

const reserveTableSchema = Joi.object({
  reservedFor: Joi.string()
    .required()
    .trim()
    .max(100),
  reservedUntil: Joi.date()
    .required()
    .greater('now'),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('available', 'occupied', 'reserved', 'cleaning')
    .required(),
});

module.exports = {
  createTableSchema,
  updateTableSchema,
  reserveTableSchema,
  statusUpdateSchema,
};