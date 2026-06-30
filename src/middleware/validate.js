const AppError = require('../utils/AppError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      throw new AppError('Validation failed', 400, true, errors);
    }
    
    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = validate;