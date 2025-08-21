const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Common validation rules
const commonValidations = {
  email: {
    in: ['body'],
    isEmail: {
      errorMessage: 'Please provide a valid email address'
    },
    normalizeEmail: true
  },
  
  password: {
    in: ['body'],
    isLength: {
      options: { min: 8, max: 128 },
      errorMessage: 'Password must be between 8 and 128 characters'
    },
    matches: {
      options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },

  firstName: {
    in: ['body'],
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'First name must be between 2 and 50 characters'
    },
    matches: {
      options: /^[a-zA-Z\s]+$/,
      errorMessage: 'First name can only contain letters and spaces'
    }
  },

  lastName: {
    in: ['body'],
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Last name must be between 2 and 50 characters'
    },
    matches: {
      options: /^[a-zA-Z\s]+$/,
      errorMessage: 'Last name can only contain letters and spaces'
    }
  },

  phone: {
    in: ['body'],
    isMobilePhone: {
      errorMessage: 'Please provide a valid phone number'
    }
  },

  amount: {
    in: ['body'],
    isFloat: {
      options: { min: 0.01 },
      errorMessage: 'Amount must be greater than 0'
    }
  },

  duration: {
    in: ['body'],
    isInt: {
      options: { min: 1, max: 120 },
      errorMessage: 'Duration must be between 1 and 120 months'
    }
  },

  interestRate: {
    in: ['body'],
    isFloat: {
      options: { min: 0.01, max: 100 },
      errorMessage: 'Interest rate must be between 0.01% and 100%'
    }
  },

  id: {
    in: ['params'],
    isMongoId: {
      errorMessage: 'Invalid ID format'
    }
  }
};

module.exports = {
  validate,
  commonValidations
}; 