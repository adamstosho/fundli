/**
 * General utility functions for the Fundli application
 */

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'NGN')
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'NGN') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₦0.00';
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
const formatPercentage = (value, decimals = 2) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.00%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format date
 * @param {Date|string} date - The date to format
 * @param {string} format - The format type ('short', 'long', 'time')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'short') => {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(dateObj);
};

/**
 * Calculate time difference in human readable format
 * @param {Date|string} date - The date to compare
 * @returns {string} Human readable time difference
 */
const timeAgo = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a unique reference number
 * @param {string} prefix - Prefix for the reference
 * @returns {string} Unique reference number
 */
const generateReference = (prefix = 'FUND') => {
  const timestamp = Date.now().toString(36);
  const random = generateRandomString(4);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Nigerian)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate BVN format
 * @param {string} bvn - BVN to validate
 * @returns {boolean} True if valid BVN
 */
const isValidBVN = (bvn) => {
  const bvnRegex = /^\d{11}$/;
  return bvnRegex.test(bvn);
};

/**
 * Validate account number format
 * @param {string} accountNumber - Account number to validate
 * @returns {boolean} True if valid account number
 */
const isValidAccountNumber = (accountNumber) => {
  const accountRegex = /^\d{10,}$/;
  return accountRegex.test(accountNumber);
};

/**
 * Mask sensitive data
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of characters to show at the end
 * @returns {string} Masked data
 */
const maskSensitiveData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars) return data;
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
};

/**
 * Calculate loan EMI (Equated Monthly Installment)
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate
 * @param {number} tenure - Loan tenure in months
 * @returns {number} Monthly EMI amount
 */
const calculateEMI = (principal, rate, tenure) => {
  if (principal <= 0 || rate < 0 || tenure <= 0) return 0;
  
  const monthlyRate = rate / (12 * 100);
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  
  return Math.round(emi * 100) / 100;
};

/**
 * Calculate compound interest
 * @param {number} principal - Principal amount
 * @param {number} rate - Annual interest rate
 * @param {number} time - Time period in years
 * @param {number} frequency - Compounding frequency per year (default: 12)
 * @returns {number} Compound interest amount
 */
const calculateCompoundInterest = (principal, rate, time, frequency = 12) => {
  if (principal <= 0 || rate < 0 || time <= 0) return 0;
  
  const amount = principal * Math.pow(1 + (rate / (100 * frequency)), frequency * time);
  return Math.round((amount - principal) * 100) / 100;
};

/**
 * Calculate simple interest
 * @param {number} principal - Principal amount
 * @param {number} rate - Annual interest rate
 * @param {number} time - Time period in years
 * @returns {number} Simple interest amount
 */
const calculateSimpleInterest = (principal, rate, time) => {
  if (principal <= 0 || rate < 0 || time <= 0) return 0;
  return Math.round((principal * rate * time) / 100 * 100) / 100;
};

/**
 * Sanitize string input
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination metadata
 */
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Bytes to convert
 * @returns {string} Human readable size
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

module.exports = {
  formatCurrency,
  formatPercentage,
  formatDate,
  timeAgo,
  generateRandomString,
  generateReference,
  isValidEmail,
  isValidPhone,
  isValidBVN,
  isValidAccountNumber,
  maskSensitiveData,
  calculateEMI,
  calculateCompoundInterest,
  calculateSimpleInterest,
  sanitizeString,
  generatePagination,
  deepClone,
  isEmpty,
  formatBytes,
  sleep,
  retryWithBackoff
};
