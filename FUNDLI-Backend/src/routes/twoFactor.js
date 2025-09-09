const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const twoFactorService = require('../services/twoFactorService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/2fa/setup
 * @desc    Generate 2FA secret and QR code
 * @access  Private
 */
router.post('/setup', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const result = await twoFactorService.generateSecret(userId, userEmail);

    logger.info('2FA setup initiated', {
      userId,
      userEmail
    });

    res.status(200).json({
      status: 'success',
      message: '2FA setup data generated',
      data: {
        qrCodeUrl: result.qrCodeUrl,
        manualEntryKey: result.manualEntryKey,
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    logger.error('Failed to setup 2FA', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/2fa/enable
 * @desc    Enable 2FA with verification token
 * @access  Private
 */
router.post('/enable', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required'
      });
    }

    if (!twoFactorService.validateTokenFormat(token)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid token format. Token must be 6 digits.'
      });
    }

    const result = await twoFactorService.enableTwoFactor(userId, token);

    logger.info('2FA enabled successfully', {
      userId,
      enabledAt: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    logger.error('Failed to enable 2FA', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable 2FA with verification token
 * @access  Private
 */
router.post('/disable', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required'
      });
    }

    if (!twoFactorService.validateTokenFormat(token)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid token format. Token must be 6 digits.'
      });
    }

    const result = await twoFactorService.disableTwoFactor(userId, token);

    logger.info('2FA disabled successfully', {
      userId,
      disabledAt: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error('Failed to disable 2FA', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify 2FA token
 * @access  Private
 */
router.post('/verify', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is required'
      });
    }

    if (!twoFactorService.validateTokenFormat(token)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid token format. Token must be 6 digits.'
      });
    }

    const result = await twoFactorService.verifyToken(userId, token);

    if (result.success) {
      logger.info('2FA token verified', {
        userId,
        verifiedAt: new Date()
      });

      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Failed to verify 2FA token', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/2fa/verify-backup
 * @desc    Verify backup code
 * @access  Private
 */
router.post('/verify-backup', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { backupCode } = req.body;

    if (!backupCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Backup code is required'
      });
    }

    const result = await twoFactorService.verifyBackupCode(userId, backupCode);

    if (result.success) {
      logger.info('Backup code verified', {
        userId,
        verifiedAt: new Date(),
        remainingCodes: result.remainingCodes
      });

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          remainingCodes: result.remainingCodes
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Failed to verify backup code', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/2fa/regenerate-backup-codes
 * @desc    Generate new backup codes
 * @access  Private
 */
router.post('/regenerate-backup-codes', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await twoFactorService.generateNewBackupCodes(userId);

    logger.info('New backup codes generated', {
      userId,
      generatedAt: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    logger.error('Failed to regenerate backup codes', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/2fa/status
 * @desc    Get 2FA status for user
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const status = await twoFactorService.getTwoFactorStatus(userId);

    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    logger.error('Failed to get 2FA status', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/2fa/time-remaining
 * @desc    Get time remaining for current token
 * @access  Private
 */
router.get('/time-remaining', protect, async (req, res) => {
  try {
    const timeRemaining = twoFactorService.getTimeRemaining();

    res.status(200).json({
      status: 'success',
      data: {
        timeRemaining
      }
    });
  } catch (error) {
    logger.error('Failed to get time remaining', {
      error: error.message
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
