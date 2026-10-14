const { body, validationResult } = require('express-validator');
const { CATEGORY_KEY_PATTERN } = require('../constants/clothingCategories');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateCustomerCreate = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('phoneNumber')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('campusId')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Campus ID cannot exceed 20 characters'),
  handleValidationErrors
];

const validateCustomerUpdate = [
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('campusId')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Campus ID cannot exceed 20 characters'),
  handleValidationErrors
];

const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one order item is required'),
  body('items.*.serviceId')
    .isMongoId()
    .withMessage('Valid service ID is required for each item'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a non-negative number'),
  body('items.*.clothingCategory')
    .optional()
    .matches(CATEGORY_KEY_PATTERN)
    .withMessage('Invalid clothing category'),
  body('pickupRequired')
    .optional()
    .isBoolean()
    .withMessage('Pickup required must be a boolean'),
  body('deliveryRequired')
    .optional()
    .isBoolean()
    .withMessage('Delivery required must be a boolean'),
  body('orderType')
    .optional()
    .isIn(['standard', 'quick', 'express'])
    .withMessage('Invalid order type'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('customerId')
    .optional()
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  body('customerInfo.name')
    .if(body('customerId').not().exists())
    .notEmpty()
    .withMessage('Customer name is required when customer ID is not provided'),
  body('customerInfo.phone')
    .if(body('customerId').not().exists())
    .notEmpty()
    .withMessage('Customer phone is required when customer ID is not provided'),
  body('specialInstructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),
  handleValidationErrors
];

// Payment validation
const validatePayment = [
  body('method')
    .isIn(['cash', 'bank_transfer'])
    .withMessage('Valid payment method is required (cash or bank_transfer)'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  body('transactionId')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),
  body('notes')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Payment notes cannot exceed 100 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUser = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'cashier'])
    .withMessage('Invalid role'),
  handleValidationErrors
];

module.exports = {
  validateCustomerCreate,
  validateCustomerUpdate,
  validateOrder,
  validatePayment,
  validateLogin,
  validateUser,
  handleValidationErrors
};
