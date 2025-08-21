const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ReferralService = require('../services/referralService');

/**
 * @route   GET /api/referrals/stats
 * @desc    Get user's referral statistics
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await ReferralService.getReferralStats(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referral statistics'
    });
  }
});

/**
 * @route   GET /api/referrals/history
 * @desc    Get user's referral history
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const history = await ReferralService.getReferralHistory(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (error) {
    console.error('Error fetching referral history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referral history'
    });
  }
});

/**
 * @route   POST /api/referrals/apply-code
 * @desc    Apply a referral code during registration
 * @access  Public
 */
router.post('/apply-code', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    
    if (!referralCode || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Referral code and user ID are required'
      });
    }

    const referral = await ReferralService.createReferral(referralCode, userId);
    
    res.status(201).json({
      status: 'success',
      message: 'Referral code applied successfully',
      data: referral
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/referrals/track-action
 * @desc    Track a platform action for referral rewards
 * @access  Private
 */
router.post('/track-action', protect, async (req, res) => {
  try {
    const { actionType, transactionAmount = 0 } = req.body;
    
    if (!actionType) {
      return res.status(400).json({
        status: 'error',
        message: 'Action type is required'
      });
    }

    const result = await ReferralService.handlePlatformAction(
      req.user.id, 
      actionType, 
      transactionAmount
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Action tracked successfully',
      data: { tracked: result }
    });
  } catch (error) {
    console.error('Error tracking action:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track action'
    });
  }
});

/**
 * @route   GET /api/referrals/eligibility
 * @desc    Check if user is eligible for referral rewards
 * @access  Private
 */
router.get('/eligibility', protect, async (req, res) => {
  try {
    const eligibility = await ReferralService.checkAndUpdateEligibility(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: eligibility
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check eligibility'
    });
  }
});

module.exports = router; 