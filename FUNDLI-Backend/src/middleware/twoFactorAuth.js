const jwt = require('jsonwebtoken');
const User = require('../models/User');
const twoFactorService = require('../services/twoFactorService');
const logger = require('../utils/logger');

/**
 * Middleware to check if 2FA is required for login
 */
const requireTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const isTwoFactorEnabled = await twoFactorService.isTwoFactorEnabled(userId);
    
    if (isTwoFactorEnabled) {
      // Check if 2FA token is provided
      const twoFactorToken = req.headers['x-2fa-token'];
      
      if (!twoFactorToken) {
        return res.status(403).json({
          status: 'error',
          message: 'Two-factor authentication required',
          requiresTwoFactor: true,
          userId: userId
        });
      }

      // Verify 2FA token
      const verification = await twoFactorService.verifyToken(userId, twoFactorToken);
      
      if (!verification.success) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid two-factor authentication token',
          requiresTwoFactor: true,
          userId: userId
        });
      }

      logger.info('2FA verification successful', {
        userId,
        verifiedAt: new Date()
      });
    }

    next();
  } catch (error) {
    logger.error('2FA middleware error', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      status: 'error',
      message: 'Two-factor authentication verification failed'
    });
  }
};

/**
 * Middleware to check if 2FA is enabled (for setup/disable operations)
 */
const checkTwoFactorStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const status = await twoFactorService.getTwoFactorStatus(userId);
    req.twoFactorStatus = status;
    
    next();
  } catch (error) {
    logger.error('2FA status check error', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to check two-factor authentication status'
    });
  }
};

/**
 * Middleware to validate 2FA token format
 */
const validateTwoFactorToken = (req, res, next) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      status: 'error',
      message: 'Two-factor authentication token is required'
    });
  }

  if (!twoFactorService.validateTokenFormat(token)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid token format. Token must be 6 digits.'
    });
  }

  next();
};

/**
 * Middleware to validate backup code format
 */
const validateBackupCode = (req, res, next) => {
  const { backupCode } = req.body;
  
  if (!backupCode) {
    return res.status(400).json({
      status: 'error',
      message: 'Backup code is required'
    });
  }

  if (typeof backupCode !== 'string' || backupCode.length !== 8) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid backup code format. Code must be 8 characters.'
    });
  }

  next();
};

module.exports = {
  requireTwoFactor,
  checkTwoFactorStatus,
  validateTwoFactorToken,
  validateBackupCode
};
