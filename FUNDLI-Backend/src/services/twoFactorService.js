const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const logger = require('../utils/logger');

class TwoFactorService {
  constructor() {
    this.serviceName = 'FUNDLI';
    this.issuer = 'FUNDLI Platform';
  }

  /**
   * Generate 2FA secret for a user
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @returns {Promise<Object>} 2FA setup data
   */
  async generateSecret(userId, userEmail) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.serviceName} (${userEmail})`,
        issuer: this.issuer,
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Store secret temporarily (will be saved when user verifies)
      user.tempTwoFactorSecret = secret.base32;
      user.twoFactorEnabled = false;
      await user.save();

      logger.info('2FA secret generated', {
        userId,
        userEmail,
        secretGenerated: true
      });

      return {
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32,
        backupCodes: this.generateBackupCodes()
      };
    } catch (error) {
      logger.error('Failed to generate 2FA secret', {
        error: error.message,
        userId,
        userEmail
      });
      throw error;
    }
  }

  /**
   * Verify 2FA token
   * @param {string} userId - User ID
   * @param {string} token - 2FA token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorSecret && !user.tempTwoFactorSecret) {
        throw new Error('2FA not set up for this user');
      }

      const secret = user.twoFactorSecret || user.tempTwoFactorSecret;
      
      // Verify token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });

      if (verified) {
        logger.info('2FA token verified successfully', {
          userId,
          tokenVerified: true
        });

        return {
          success: true,
          message: 'Token verified successfully'
        };
      } else {
        logger.warn('2FA token verification failed', {
          userId,
          tokenVerified: false
        });

        return {
          success: false,
          message: 'Invalid token'
        };
      }
    } catch (error) {
      logger.error('Failed to verify 2FA token', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Enable 2FA for user
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Enable result
   */
  async enableTwoFactor(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.tempTwoFactorSecret) {
        throw new Error('No pending 2FA setup found');
      }

      // Verify the token
      const verification = await this.verifyToken(userId, token);
      if (!verification.success) {
        throw new Error('Invalid verification token');
      }

      // Enable 2FA
      user.twoFactorSecret = user.tempTwoFactorSecret;
      user.twoFactorEnabled = true;
      user.tempTwoFactorSecret = undefined;
      user.twoFactorBackupCodes = this.generateBackupCodes();
      user.twoFactorEnabledAt = new Date();
      
      await user.save();

      logger.info('2FA enabled successfully', {
        userId,
        twoFactorEnabled: true,
        enabledAt: user.twoFactorEnabledAt
      });

      return {
        success: true,
        message: 'Two-factor authentication enabled successfully',
        backupCodes: user.twoFactorBackupCodes
      };
    } catch (error) {
      logger.error('Failed to enable 2FA', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Disable 2FA for user
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Disable result
   */
  async disableTwoFactor(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this user');
      }

      // Verify the token
      const verification = await this.verifyToken(userId, token);
      if (!verification.success) {
        throw new Error('Invalid verification token');
      }

      // Disable 2FA
      user.twoFactorSecret = undefined;
      user.twoFactorEnabled = false;
      user.twoFactorBackupCodes = undefined;
      user.twoFactorDisabledAt = new Date();
      
      await user.save();

      logger.info('2FA disabled successfully', {
        userId,
        twoFactorEnabled: false,
        disabledAt: user.twoFactorDisabledAt
      });

      return {
        success: true,
        message: 'Two-factor authentication disabled successfully'
      };
    } catch (error) {
      logger.error('Failed to disable 2FA', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Verify backup code
   * @param {string} userId - User ID
   * @param {string} backupCode - Backup code
   * @returns {Promise<Object>} Verification result
   */
  async verifyBackupCode(userId, backupCode) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorBackupCodes || !Array.isArray(user.twoFactorBackupCodes)) {
        throw new Error('No backup codes available');
      }

      const codeIndex = user.twoFactorBackupCodes.indexOf(backupCode);
      if (codeIndex === -1) {
        logger.warn('Invalid backup code used', {
          userId,
          backupCodeUsed: false
        });

        return {
          success: false,
          message: 'Invalid backup code'
        };
      }

      // Remove used backup code
      user.twoFactorBackupCodes.splice(codeIndex, 1);
      await user.save();

      logger.info('Backup code verified successfully', {
        userId,
        backupCodeUsed: true,
        remainingCodes: user.twoFactorBackupCodes.length
      });

      return {
        success: true,
        message: 'Backup code verified successfully',
        remainingCodes: user.twoFactorBackupCodes.length
      };
    } catch (error) {
      logger.error('Failed to verify backup code', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Generate new backup codes
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New backup codes
   */
  async generateNewBackupCodes(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this user');
      }

      const newBackupCodes = this.generateBackupCodes();
      user.twoFactorBackupCodes = newBackupCodes;
      await user.save();

      logger.info('New backup codes generated', {
        userId,
        codesGenerated: true
      });

      return {
        success: true,
        message: 'New backup codes generated successfully',
        backupCodes: newBackupCodes
      };
    } catch (error) {
      logger.error('Failed to generate new backup codes', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Check if user has 2FA enabled
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} 2FA status
   */
  async isTwoFactorEnabled(userId) {
    try {
      const user = await User.findById(userId);
      return user ? user.twoFactorEnabled : false;
    } catch (error) {
      logger.error('Failed to check 2FA status', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  /**
   * Get 2FA status for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} 2FA status info
   */
  async getTwoFactorStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        enabled: user.twoFactorEnabled,
        hasBackupCodes: user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0,
        backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0,
        enabledAt: user.twoFactorEnabledAt,
        disabledAt: user.twoFactorDisabledAt
      };
    } catch (error) {
      logger.error('Failed to get 2FA status', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Generate backup codes
   * @returns {Array} Array of backup codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Validate TOTP token format
   * @param {string} token - Token to validate
   * @returns {boolean} Is valid format
   */
  validateTokenFormat(token) {
    return /^\d{6}$/.test(token);
  }

  /**
   * Get time remaining for current token
   * @returns {number} Seconds remaining
   */
  getTimeRemaining() {
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const timeStep = 30;
    return timeStep - (epoch % timeStep);
  }
}

module.exports = new TwoFactorService();
