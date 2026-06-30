const Joi = require('joi');
const mongoose = require('mongoose');

const orderItemSchema = Joi.object({
  menuItemId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required(),
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required(),
  specialInstructions: Joi.string()
    .max(200)
    .allow('', null),
});

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .max(50)
    .required(),
  customerNote: Joi.string()
    .max(300)
    .allow('', null),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'preparing', 'ready', 'served', 'cancelled')
    .required(),
});

const rejectOrderSchema = Joi.object({
  reason: Joi.string()
    .required()
    .min(3)
    .max(500),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  rejectOrderSchema,
};