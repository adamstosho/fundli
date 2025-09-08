/**
 * Logging utilities for the Fundli application
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Current log level (can be set via environment variable)
 */
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

/**
 * Get timestamp for logs
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
};

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
const writeToFile = (level, message, meta = {}) => {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const formattedMessage = formatMessage(level, message, meta);
  
  fs.appendFileSync(logFile, formattedMessage + '\n');
};

/**
 * Write log to console
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
const writeToConsole = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
  
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] ❌ ERROR: ${message}${metaStr}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] ⚠️  WARN: ${message}${metaStr}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] ℹ️  INFO: ${message}${metaStr}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] 🐛 DEBUG: ${message}${metaStr}`);
      break;
    default:
      console.log(`[${timestamp}] ${level}: ${message}${metaStr}`);
  }
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {object} meta - Additional metadata
 */
const error = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    writeToConsole('ERROR', message, meta);
    writeToFile('ERROR', message, meta);
  }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    writeToConsole('WARN', message, meta);
    writeToFile('WARN', message, meta);
  }
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    writeToConsole('INFO', message, meta);
    writeToFile('INFO', message, meta);
  }
};

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    writeToConsole('DEBUG', message, meta);
    writeToFile('DEBUG', message, meta);
  }
};

/**
 * Log API request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} responseTime - Response time in milliseconds
 */
const logRequest = (req, res, responseTime) => {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous'
  };

  const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
  
  if (res.statusCode >= 500) {
    error(message, meta);
  } else if (res.statusCode >= 400) {
    warn(message, meta);
  } else {
    info(message, meta);
  }
};

/**
 * Log database operation
 * @param {string} operation - Database operation (CREATE, READ, UPDATE, DELETE)
 * @param {string} collection - Collection name
 * @param {object} meta - Additional metadata
 */
const logDatabase = (operation, collection, meta = {}) => {
  const message = `Database ${operation} operation on ${collection}`;
  debug(message, meta);
};

/**
 * Log authentication event
 * @param {string} event - Authentication event (LOGIN, LOGOUT, REGISTER, etc.)
 * @param {string} userId - User ID
 * @param {object} meta - Additional metadata
 */
const logAuth = (event, userId, meta = {}) => {
  const message = `Authentication ${event} for user ${userId}`;
  info(message, meta);
};

/**
 * Log payment transaction
 * @param {string} transactionId - Transaction ID
 * @param {string} status - Transaction status
 * @param {object} meta - Additional metadata
 */
const logPayment = (transactionId, status, meta = {}) => {
  const message = `Payment transaction ${transactionId} - ${status}`;
  info(message, meta);
};

/**
 * Log KYC verification
 * @param {string} userId - User ID
 * @param {string} type - KYC type (BVN, BANK_ACCOUNT, etc.)
 * @param {string} status - Verification status
 * @param {object} meta - Additional metadata
 */
const logKYC = (userId, type, status, meta = {}) => {
  const message = `KYC ${type} verification for user ${userId} - ${status}`;
  info(message, meta);
};

/**
 * Log loan operation
 * @param {string} operation - Loan operation (APPLY, APPROVE, REJECT, DISBURSE, etc.)
 * @param {string} loanId - Loan ID
 * @param {string} userId - User ID
 * @param {object} meta - Additional metadata
 */
const logLoan = (operation, loanId, userId, meta = {}) => {
  const message = `Loan ${operation} - Loan ID: ${loanId}, User ID: ${userId}`;
  info(message, meta);
};

/**
 * Log investment operation
 * @param {string} operation - Investment operation (CREATE, UPDATE, PAYMENT, etc.)
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {object} meta - Additional metadata
 */
const logInvestment = (operation, investmentId, userId, meta = {}) => {
  const message = `Investment ${operation} - Investment ID: ${investmentId}, User ID: ${userId}`;
  info(message, meta);
};

/**
 * Log security event
 * @param {string} event - Security event
 * @param {string} severity - Event severity (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {object} meta - Additional metadata
 */
const logSecurity = (event, severity = 'MEDIUM', meta = {}) => {
  const message = `Security event: ${event} (${severity})`;
  
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    error(message, meta);
  } else if (severity === 'MEDIUM') {
    warn(message, meta);
  } else {
    info(message, meta);
  }
};

/**
 * Log performance metrics
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {object} meta - Additional metadata
 */
const logPerformance = (operation, duration, meta = {}) => {
  const message = `Performance: ${operation} took ${duration}ms`;
  
  if (duration > 5000) {
    warn(message, meta);
  } else if (duration > 1000) {
    info(message, meta);
  } else {
    debug(message, meta);
  }
};

/**
 * Create request logger middleware
 * @returns {Function} Express middleware function
 */
const createRequestLogger = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logRequest(req, res, responseTime);
    });
    
    next();
  };
};

/**
 * Set log level
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 */
const setLogLevel = (level) => {
  const newLevel = LOG_LEVELS[level.toUpperCase()];
  if (newLevel !== undefined) {
    process.env.LOG_LEVEL = level.toUpperCase();
    info(`Log level changed to ${level.toUpperCase()}`);
  } else {
    warn(`Invalid log level: ${level}`);
  }
};

/**
 * Get current log level
 * @returns {string} Current log level
 */
const getLogLevel = () => {
  return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel);
};

module.exports = {
  error,
  warn,
  info,
  debug,
  logRequest,
  logDatabase,
  logAuth,
  logPayment,
  logKYC,
  logLoan,
  logInvestment,
  logSecurity,
  logPerformance,
  createRequestLogger,
  setLogLevel,
  getLogLevel,
  LOG_LEVELS
};
