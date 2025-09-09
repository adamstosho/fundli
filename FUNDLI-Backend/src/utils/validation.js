/**
 * Validation utilities for the Fundli application
 */

const { isValidEmail, isValidPhone, isValidBVN, isValidAccountNumber } = require('./helpers');

/**
 * Validation rules for user registration
 */
const userRegistrationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'First name must be 2-50 characters and contain only letters and spaces'
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Last name must be 2-50 characters and contain only letters and spaces'
  },
  email: {
    required: true,
    validator: isValidEmail,
    message: 'Please provide a valid email address'
  },
  phone: {
    required: true,
    validator: isValidPhone,
    message: 'Please provide a valid Nigerian phone number'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  },
  userType: {
    required: true,
    enum: ['borrower', 'lender', 'admin'],
    message: 'User type must be borrower, lender, or admin'
  }
};

/**
 * Validation rules for loan application
 */
const loanApplicationRules = {
  loanAmount: {
    required: true,
    min: 10,
    max: 100000,
    type: 'number',
    message: 'Loan amount must be between $10 and $100,000'
  },
  purpose: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Loan purpose must be 10-500 characters'
  },
  duration: {
    required: true,
    min: 1,
    max: 60,
    type: 'number',
    message: 'Loan duration must be between 1 and 60 months'
  },
  collateral: {
    required: false,
    maxLength: 1000,
    message: 'Collateral description must not exceed 1000 characters'
  }
};

/**
 * Validation rules for KYC submission
 */
const kycRules = {
  bvn: {
    required: true,
    validator: isValidBVN,
    message: 'BVN must be exactly 11 digits'
  },
  accountNumber: {
    required: true,
    validator: isValidAccountNumber,
    message: 'Account number must be at least 10 digits'
  },
  bankCode: {
    required: true,
    minLength: 3,
    maxLength: 10,
    pattern: /^[A-Z0-9]+$/,
    message: 'Bank code must be 3-10 alphanumeric characters'
  }
};

/**
 * Validation rules for lending pool creation
 */
const lendingPoolRules = {
  name: {
    required: true,
    minLength: 5,
    maxLength: 100,
    message: 'Pool name must be 5-100 characters'
  },
  description: {
    required: true,
    minLength: 20,
    maxLength: 1000,
    message: 'Pool description must be 20-1000 characters'
  },
  poolSize: {
    required: true,
    min: 100,
    max: 500000,
    type: 'number',
    message: 'Pool size must be between $100 and $500,000'
  },
  interestRate: {
    required: true,
    min: 5,
    max: 50,
    type: 'number',
    message: 'Interest rate must be between 5% and 50%'
  },
  duration: {
    required: true,
    min: 1,
    max: 60,
    type: 'number',
    message: 'Duration must be between 1 and 60 months'
  },
  riskLevel: {
    required: true,
    enum: ['low', 'medium', 'high'],
    message: 'Risk level must be low, medium, or high'
  },
  category: {
    required: true,
    enum: ['personal', 'business', 'education', 'health', 'agriculture', 'real_estate', 'other'],
    message: 'Category must be one of the predefined options'
  }
};

/**
 * Validation rules for investment
 */
const investmentRules = {
  amount: {
    required: true,
    min: 10,
    max: 100000,
    type: 'number',
    message: 'Investment amount must be between $10 and $100,000'
  },
  lendingPoolId: {
    required: false,
    type: 'objectId',
    message: 'Lending pool ID must be a valid MongoDB ObjectId'
  },
  loanId: {
    required: false,
    type: 'objectId',
    message: 'Loan ID must be a valid MongoDB ObjectId'
  }
};

/**
 * Validation rules for transaction
 */
const transactionRules = {
  amount: {
    required: true,
    min: 1,
    type: 'number',
    message: 'Transaction amount must be greater than 0'
  },
  type: {
    required: true,
    enum: ['deposit', 'withdrawal', 'investment', 'loan_disbursement', 'repayment', 'interest_payment', 'fee'],
    message: 'Transaction type must be one of the predefined options'
  },
  paymentMethod: {
    required: true,
    enum: ['bank_transfer', 'card', 'wallet', 'paystack', 'flutterwave'],
    message: 'Payment method must be one of the predefined options'
  }
};

/**
 * Generic validation function
 * @param {object} data - Data to validate
 * @param {object} rules - Validation rules
 * @returns {object} Validation result
 */
const validate = (data, rules) => {
  const errors = {};
  const sanitizedData = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Check if required field is missing
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = rule.message || `${field} is required`;
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitizedData[field] = value;
      continue;
    }

    // Type validation
    if (rule.type === 'number' && typeof value !== 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors[field] = `${field} must be a valid number`;
        continue;
      }
      sanitizedData[field] = numValue;
    } else if (rule.type === 'objectId' && !isValidObjectId(value)) {
      errors[field] = `${field} must be a valid ObjectId`;
      continue;
    } else {
      sanitizedData[field] = value;
    }

    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
      continue;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.message || `${field} must not exceed ${rule.maxLength} characters`;
      continue;
    }

    // Numeric range validation
    if (rule.min !== undefined && value < rule.min) {
      errors[field] = rule.message || `${field} must be at least ${rule.min}`;
      continue;
    }

    if (rule.max !== undefined && value > rule.max) {
      errors[field] = rule.message || `${field} must not exceed ${rule.max}`;
      continue;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} format is invalid`;
      continue;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors[field] = rule.message || `${field} must be one of: ${rule.enum.join(', ')}`;
      continue;
    }

    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      errors[field] = rule.message || `${field} is invalid`;
      continue;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData
  };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ObjectId to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate pagination parameters
 * @param {object} params - Pagination parameters
 * @returns {object} Validation result
 */
const validatePagination = (params) => {
  const { page = 1, limit = 10 } = params;
  const errors = {};

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    errors.page = 'Page must be a positive integer';
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.limit = 'Limit must be between 1 and 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      page: Math.max(1, pageNum),
      limit: Math.min(100, Math.max(1, limitNum))
    }
  };
};

/**
 * Validate file upload
 * @param {object} file - File object
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = false
  } = options;

  const errors = {};

  if (required && !file) {
    errors.file = 'File is required';
    return { isValid: false, errors };
  }

  if (!file) {
    return { isValid: true, errors: {} };
  }

  if (file.size > maxSize) {
    errors.size = `File size must not exceed ${Math.round(maxSize / (1024 * 1024))}MB`;
  }

  if (!allowedTypes.includes(file.mimetype)) {
    errors.type = `File type must be one of: ${allowedTypes.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input data
 * @param {object} data - Data to sanitize
 * @returns {object} Sanitized data
 */
const sanitizeInput = (data) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove HTML tags and trim whitespace
      sanitized[key] = value.trim().replace(/<[^>]*>/g, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = {
  userRegistrationRules,
  loanApplicationRules,
  kycRules,
  lendingPoolRules,
  investmentRules,
  transactionRules,
  validate,
  isValidObjectId,
  validatePagination,
  validateFile,
  sanitizeInput
};
