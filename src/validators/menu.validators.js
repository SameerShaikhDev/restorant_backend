const Joi = require('joi');
const mongoose = require('mongoose');

const createMenuItemSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .max(100),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('', null),
  price: Joi.number()
    .required()
    .min(0)
    .max(99999.99),
  categoryId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required(),
  imageUrl: Joi.string()
    .uri()
    .allow('', null),
  isVeg: Joi.boolean().default(false),
  isBestSeller: Joi.boolean().default(false),
  rating: Joi.number()
    .min(0)
    .max(5)
    .default(0),
  prepTimeMinutes: Joi.number()
    .integer()
    .min(0)
    .max(120)
    .default(15),
  spiceLevel: Joi.string()
    .valid('mild', 'medium', 'hot')
    .default('medium'),
  ingredients: Joi.array()
    .items(Joi.string().trim())
    .default([]),
  isAvailable: Joi.boolean().default(true),
});

const updateMenuItemSchema = createMenuItemSchema.fork(
  ['name', 'price', 'categoryId'],
  (schema) => schema.optional()
);

const createCategorySchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .max(50),
  displayOrder: Joi.number()
    .integer()
    .min(0)
    .default(0),
  isActive: Joi.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.fork(
  ['name'],
  (schema) => schema.optional()
);

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  updateCategorySchema,
};