/**
 * Validation middleware for the Fundli application
 */

const { validationResult } = require('express-validator');
const { validate: runRulesValidation, validatePagination, validateFile, sanitizeInput } = require('../utils/validation');
const { ERROR_CODES, HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Generic validation middleware
 * @param {object} rules - Validation rules
 * @param {string} source - Source of data ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validateData = (rules, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      
      if (!data || typeof data !== 'object') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid request data',
          errorCode: ERROR_CODES.VALIDATION_ERROR
        });
      }

      // Sanitize input data
      const sanitizedData = sanitizeInput(data);
      
      // Validate data against custom rules
      const validation = runRulesValidation(sanitizedData, rules);
      
      if (!validation.isValid) {
        logger.warn('Validation failed', {
          source,
          errors: validation.errors,
          data: sanitizedData,
          url: req.originalUrl,
          method: req.method,
          userId: req.user?.id || 'anonymous'
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Validation failed',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          errors: validation.errors
        });
      }

      // Replace original data with sanitized and validated data
      req[source] = validation.data;
      
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack,
        source,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Validation processing error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Validate request body
 * @param {object} rules - Validation rules
 * @returns {Function} Express middleware function
 */
const validateBody = (rules) => {
  return validateData(rules, 'body');
};

/**
 * Validate query parameters
 * @param {object} rules - Validation rules
 * @returns {Function} Express middleware function
 */
const validateQuery = (rules) => {
  return validateData(rules, 'query');
};

/**
 * Validate route parameters
 * @param {object} rules - Validation rules
 * @returns {Function} Express middleware function
 */
const validateParams = (rules) => {
  return validateData(rules, 'params');
};

/**
 * Validate pagination parameters
 * @returns {Function} Express middleware function
 */
const validatePaginationParams = () => {
  return (req, res, next) => {
    try {
      const validation = validatePagination(req.query);
      
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid pagination parameters',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          errors: validation.errors
        });
      }

      // Add validated pagination data to request
      req.pagination = validation.data;
      
      next();
    } catch (error) {
      logger.error('Pagination validation error', {
        error: error.message,
        query: req.query,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Pagination validation error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Validate file upload
 * @param {object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validateFileUpload = (options = {}) => {
  return (req, res, next) => {
    try {
      const file = req.file || req.files;
      
      const validation = validateFile(file, options);
      
      if (!validation.isValid) {
        logger.warn('File validation failed', {
          errors: validation.errors,
          fileName: file?.originalname,
          fileSize: file?.size,
          fileType: file?.mimetype,
          url: req.originalUrl,
          method: req.method,
          userId: req.user?.id || 'anonymous'
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'File validation failed',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          errors: validation.errors
        });
      }

      next();
    } catch (error) {
      logger.error('File validation middleware error', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'File validation processing error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} paramName - Parameter name containing the ObjectId
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: `${paramName} parameter is required`,
          errorCode: ERROR_CODES.VALIDATION_ERROR
        });
      }

      // Basic ObjectId format validation
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: `Invalid ${paramName} format`,
          errorCode: ERROR_CODES.VALIDATION_ERROR
        });
      }

      next();
    } catch (error) {
      logger.error('ObjectId validation error', {
        error: error.message,
        paramName,
        paramValue: req.params[paramName],
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'ObjectId validation error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Validate user type
 * @param {string|array} allowedTypes - Allowed user types
 * @returns {Function} Express middleware function
 */
const validateUserType = (allowedTypes) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
          errorCode: ERROR_CODES.AUTHENTICATION_ERROR
        });
      }

      const userType = req.user.userType;
      const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

      if (!types.includes(userType)) {
        logger.warn('User type validation failed', {
          userType,
          allowedTypes: types,
          userId: req.user.id,
          url: req.originalUrl,
          method: req.method
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: 'error',
          message: 'Access denied. Insufficient permissions.',
          errorCode: ERROR_CODES.AUTHORIZATION_ERROR
        });
      }

      next();
    } catch (error) {
      logger.error('User type validation error', {
        error: error.message,
        allowedTypes,
        userId: req.user?.id,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'User type validation error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Validate request size
 * @param {number} maxSize - Maximum request size in bytes
 * @returns {Function} Express middleware function
 */
const validateRequestSize = (maxSize = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    try {
      const contentLength = parseInt(req.get('content-length') || '0');
      
      if (contentLength > maxSize) {
        logger.warn('Request size exceeded', {
          contentLength,
          maxSize,
          url: req.originalUrl,
          method: req.method,
          userId: req.user?.id || 'anonymous'
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Request size exceeds maximum allowed limit',
          errorCode: ERROR_CODES.VALIDATION_ERROR
        });
      }

      next();
    } catch (error) {
      logger.error('Request size validation error', {
        error: error.message,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Request size validation error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Validate required fields
 * @param {array} fields - Required field names
 * @param {string} source - Source of data ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validateRequired = (fields, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const missing = [];

      for (const field of fields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          missing.push(field);
        }
      }

      if (missing.length > 0) {
        logger.warn('Required fields missing', {
          missing,
          source,
          url: req.originalUrl,
          method: req.method,
          userId: req.user?.id || 'anonymous'
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Required fields are missing',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          missing
        });
      }

      next();
    } catch (error) {
      logger.error('Required fields validation error', {
        error: error.message,
        fields,
        source,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Required fields validation error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Sanitize request data
 * @param {string} source - Source of data ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const sanitizeData = (source = 'body') => {
  return (req, res, next) => {
    try {
      if (req[source] && typeof req[source] === 'object') {
        req[source] = sanitizeInput(req[source]);
      }
      next();
    } catch (error) {
      logger.error('Data sanitization error', {
        error: error.message,
        source,
        url: req.originalUrl,
        method: req.method
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Data sanitization error',
        errorCode: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

module.exports = {
  // Express-validator compatibility middleware: collects validationResult errors
  validate: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'error',
        message: 'Validation failed',
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: errors.array().reduce((acc, err) => {
          acc[err.path || err.param] = err.msg;
          return acc;
        }, {})
      });
    }
    next();
  },
  validateData,
  validateBody,
  validateQuery,
  validateParams,
  validatePaginationParams,
  validateFileUpload,
  validateObjectId,
  validateUserType,
  validateRequestSize,
  validateRequired,
  sanitizeData
};