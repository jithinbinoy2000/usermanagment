const { body } = require('express-validator');

exports.validateAccount = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').notEmpty().isMobilePhone().withMessage('Phone required'),
];
