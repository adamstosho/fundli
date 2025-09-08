const logger = require('../utils/logger');
const { ERROR_CODES, HTTP_STATUS } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with detailed information
  logger.error('Application Error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
    errorCode: err.code,
    errorName: err.name
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = { 
      message, 
      statusCode: HTTP_STATUS.CONFLICT,
      errorCode: ERROR_CODES.DUPLICATE_ENTRY,
      field
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    const message = 'Validation failed';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      errors
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = { 
      message, 
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      errorCode: ERROR_CODES.AUTHENTICATION_ERROR
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = { 
      message, 
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      errorCode: ERROR_CODES.AUTHENTICATION_ERROR
    };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size exceeds the maximum allowed limit';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field in request';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files uploaded';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR
    };
  }

  // Cloudinary errors
  if (err.http_code && err.http_code >= 400) {
    const message = 'File upload service error';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.SERVICE_UNAVAILABLE
    };
  }

  // Paystack errors
  if (err.name === 'PaystackError') {
    const message = err.message || 'Payment processing error';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.PAYMENT_FAILED
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Rate limit exceeded. Please try again later.';
    error = { 
      message, 
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      errorCode: ERROR_CODES.RATE_LIMITED
    };
  }

  // Network/Connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const message = 'External service unavailable';
    error = { 
      message, 
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      errorCode: ERROR_CODES.SERVICE_UNAVAILABLE
    };
  }

  // Timeout errors
  if (err.code === 'ETIMEDOUT') {
    const message = 'Request timeout';
    error = { 
      message, 
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      errorCode: ERROR_CODES.SERVICE_UNAVAILABLE
    };
  }

  // Permission errors
  if (err.name === 'ForbiddenError') {
    const message = 'Access denied';
    error = { 
      message, 
      statusCode: HTTP_STATUS.FORBIDDEN,
      errorCode: ERROR_CODES.AUTHORIZATION_ERROR
    };
  }

  // Not found errors
  if (err.name === 'NotFoundError') {
    const message = 'Resource not found';
    error = { 
      message, 
      statusCode: HTTP_STATUS.NOT_FOUND,
      errorCode: ERROR_CODES.NOT_FOUND
    };
  }

  // Business logic errors
  if (err.name === 'BusinessLogicError') {
    const message = err.message || 'Business logic error';
    error = { 
      message, 
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR
    };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'Internal server error';
  const errorCode = error.errorCode || ERROR_CODES.INTERNAL_ERROR;

  // Prepare response
  const response = {
    status: 'error',
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      name: err.name,
      code: err.code,
      errors: error.errors
    };
  }

  // Add validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  // Add field information for duplicate key errors
  if (error.field) {
    response.field = error.field;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler }; 