/**
 * Application constants for the Fundli platform
 */

/**
 * User types
 */
const USER_TYPES = {
  BORROWER: 'borrower',
  LENDER: 'lender',
  ADMIN: 'admin'
};

/**
 * User statuses
 */
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

/**
 * KYC statuses
 */
const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  VERIFIED: 'verified'
};

/**
 * Loan statuses
 */
const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISBURSED: 'disbursed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DEFAULTED: 'defaulted',
  CANCELLED: 'cancelled',
  KYC_PENDING: 'kyc_pending'
};

/**
 * Investment statuses
 */
const INVESTMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DEFAULTED: 'defaulted',
  CANCELLED: 'cancelled'
};

/**
 * Lending pool statuses
 */
const POOL_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  FUNDED: 'funded',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
};

/**
 * Transaction types
 */
const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  INVESTMENT: 'investment',
  LOAN_DISBURSEMENT: 'loan_disbursement',
  REPAYMENT: 'repayment',
  INTEREST_PAYMENT: 'interest_payment',
  FEE: 'fee',
  REFUND: 'refund',
  REFERRAL_BONUS: 'referral_bonus'
};

/**
 * Transaction statuses
 */
const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

/**
 * Payment methods
 */
const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  WALLET: 'wallet',
  PAYSTACK: 'paystack',
  FLUTTERWAVE: 'flutterwave'
};

/**
 * Risk levels
 */
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Loan categories
 */
const LOAN_CATEGORIES = {
  PERSONAL: 'personal',
  BUSINESS: 'business',
  EDUCATION: 'education',
  HEALTH: 'health',
  AGRICULTURE: 'agriculture',
  REAL_ESTATE: 'real_estate',
  OTHER: 'other'
};

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  LOAN_APPROVED: 'loan_approved',
  LOAN_REJECTED: 'loan_rejected',
  LOAN_DISBURSED: 'loan_disbursed',
  PAYMENT_DUE: 'payment_due',
  PAYMENT_RECEIVED: 'payment_received',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  INVESTMENT_CREATED: 'investment_created',
  INVESTMENT_MATURED: 'investment_matured',
  REFERRAL_BONUS: 'referral_bonus',
  SYSTEM_UPDATE: 'system_update',
  SECURITY_ALERT: 'security_alert'
};

/**
 * Notification priorities
 */
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * File upload limits
 */
const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
};

/**
 * API rate limits
 */
const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // login attempts per window
  },
  KYC: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // KYC attempts per hour
  }
};

/**
 * Interest rate ranges
 */
const INTEREST_RATES = {
  MIN: 0, // No minimum
  MAX: 1000, // No practical maximum
  DEFAULT: 15 // 15% default
};

/**
 * Loan amount limits
 */
const LOAN_LIMITS = {
  MIN: 0, // No minimum
  MAX: 999999999, // No practical maximum
  DEFAULT: 500 // $500 default
};

/**
 * Investment limits
 */
const INVESTMENT_LIMITS = {
  MIN: 0, // No minimum
  MAX: 999999999, // No practical maximum
  DEFAULT: 100 // $100 default
};

/**
 * Duration limits (in months)
 */
const DURATION_LIMITS = {
  MIN: 1, // 1 month minimum
  MAX: 999999, // No practical maximum
  DEFAULT: 12 // 12 months default
};

/**
 * Referral system
 */
const REFERRAL = {
  BONUS_AMOUNT: 10, // $10 bonus
  MIN_INVESTMENT_FOR_BONUS: 100, // $100 minimum investment
  BONUS_PAYOUT_DELAY: 30 // 30 days delay before bonus payout
};

/**
 * Email templates
 */
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  LOAN_APPROVED: 'loan_approved',
  LOAN_REJECTED: 'loan_rejected',
  PAYMENT_REMINDER: 'payment_reminder',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  INVESTMENT_MATURED: 'investment_matured',
  REFERRAL_BONUS: 'referral_bonus'
};

/**
 * SMS templates
 */
const SMS_TEMPLATES = {
  OTP: 'otp',
  PAYMENT_REMINDER: 'payment_reminder',
  LOAN_APPROVED: 'loan_approved',
  SECURITY_ALERT: 'security_alert'
};

/**
 * Database collection names
 */
const COLLECTIONS = {
  USERS: 'users',
  LOANS: 'loans',
  INVESTMENTS: 'investments',
  LENDING_POOLS: 'lendingpools',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  REFERRALS: 'referrals',
  COLLATERAL: 'collateral'
};

/**
 * Cache keys
 */
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  LOAN_DETAILS: (loanId) => `loan:details:${loanId}`,
  INVESTMENT_DETAILS: (investmentId) => `investment:details:${investmentId}`,
  POOL_DETAILS: (poolId) => `pool:details:${poolId}`,
  MARKETPLACE_STATS: 'marketplace:stats',
  USER_STATS: (userId) => `user:stats:${userId}`
};

/**
 * Error codes
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  KYC_VERIFICATION_FAILED: 'KYC_VERIFICATION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Success messages
 */
const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  LOAN_APPLIED: 'Loan application submitted successfully',
  LOAN_APPROVED: 'Loan approved successfully',
  INVESTMENT_CREATED: 'Investment created successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  KYC_SUBMITTED: 'KYC submitted successfully',
  KYC_APPROVED: 'KYC approved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully'
};

/**
 * Error messages
 */
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  LOAN_NOT_FOUND: 'Loan not found',
  INVESTMENT_NOT_FOUND: 'Investment not found',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  KYC_REQUIRED: 'KYC verification required',
  LOAN_ALREADY_APPROVED: 'Loan already approved',
  INVESTMENT_ALREADY_EXISTS: 'Investment already exists',
  PAYMENT_FAILED: 'Payment processing failed',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMITED: 'Too many requests, please try again later',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden'
};

/**
 * HTTP status codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Environment variables
 */
const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  MONGODB_URI: 'MONGODB_URI',
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRE: 'JWT_EXPIRE',
  PAYSTACK_SECRET_KEY: 'PAYSTACK_SECRET_KEY',
  FLUTTERWAVE_SECRET_KEY: 'FLUTTERWAVE_SECRET_KEY',
  CLOUDINARY_CLOUD_NAME: 'CLOUDINARY_CLOUD_NAME',
  CLOUDINARY_API_KEY: 'CLOUDINARY_API_KEY',
  CLOUDINARY_API_SECRET: 'CLOUDINARY_API_SECRET',
  EMAIL_HOST: 'EMAIL_HOST',
  EMAIL_PORT: 'EMAIL_PORT',
  EMAIL_USER: 'EMAIL_USER',
  EMAIL_PASS: 'EMAIL_PASS',
  FRONTEND_URL: 'FRONTEND_URL',
  LOG_LEVEL: 'LOG_LEVEL'
};

module.exports = {
  USER_TYPES,
  USER_STATUS,
  KYC_STATUS,
  LOAN_STATUS,
  INVESTMENT_STATUS,
  POOL_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  RISK_LEVELS,
  LOAN_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  FILE_LIMITS,
  RATE_LIMITS,
  INTEREST_RATES,
  LOAN_LIMITS,
  INVESTMENT_LIMITS,
  DURATION_LIMITS,
  REFERRAL,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  COLLECTIONS,
  CACHE_KEYS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  HTTP_STATUS,
  ENV_VARS
};
