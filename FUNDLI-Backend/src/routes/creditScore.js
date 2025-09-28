const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const creditScoreService = require('../services/creditScoreService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/credit-score/:userId
 * @desc    Get user's credit score
 * @access  Private
 */
router.get('/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const scoreRange = creditScoreService.getScoreRange(user.creditScore);

    res.status(200).json({
      status: 'success',
      data: {
        creditScore: user.creditScore,
        scoreRange,
        updatedAt: user.creditScoreUpdatedAt,
        userId
      }
    });
  } catch (error) {
    logger.error('Failed to get credit score via API', {
      error: error.message,
      userId: req.params.userId,
      requesterId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/credit-score/:userId/calculate
 * @desc    Calculate and update user's credit score
 * @access  Private (Admin)
 */
router.post('/:userId/calculate', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await creditScoreService.updateCreditScore(userId);

    logger.info('Credit score calculated via API', {
      userId,
      creditScore: result.creditScore,
      updatedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Credit score updated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to calculate credit score via API', {
      error: error.message,
      userId: req.params.userId,
      updatedBy: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credit-score/:userId/factors
 * @desc    Get detailed credit score factors
 * @access  Private
 */
router.get('/:userId/factors', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const factors = await creditScoreService.getCreditScoreFactors(userId);

    res.status(200).json({
      status: 'success',
      data: { factors }
    });
  } catch (error) {
    logger.error('Failed to get credit score factors via API', {
      error: error.message,
      userId: req.params.userId,
      requesterId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credit-score/:userId/history
 * @desc    Get credit score history
 * @access  Private
 */
router.get('/:userId/history', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const history = await creditScoreService.getCreditScoreHistory(userId);

    res.status(200).json({
      status: 'success',
      data: { history }
    });
  } catch (error) {
    logger.error('Failed to get credit score history via API', {
      error: error.message,
      userId: req.params.userId,
      requesterId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credit-score/:userId/recommendations
 * @desc    Get credit score improvement recommendations
 * @access  Private
 */
router.get('/:userId/recommendations', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const recommendations = await creditScoreService.getCreditScoreRecommendations(userId);

    res.status(200).json({
      status: 'success',
      data: { recommendations }
    });
  } catch (error) {
    logger.error('Failed to get credit score recommendations via API', {
      error: error.message,
      userId: req.params.userId,
      requesterId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/credit-score/bulk-update
 * @desc    Update credit scores for multiple users
 * @access  Private (Admin)
 */
router.post('/bulk-update', adminAuth, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'User IDs array is required'
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const userId of userIds) {
      try {
        await creditScoreService.updateCreditScore(userId);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId,
          error: error.message
        });
      }
      results.processed++;
    }

    logger.info('Bulk credit score update completed via API', {
      totalProcessed: results.processed,
      successful: results.successful,
      failed: results.failed,
      updatedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Bulk credit score update completed',
      data: results
    });
  } catch (error) {
    logger.error('Failed to perform bulk credit score update via API', {
      error: error.message,
      updatedBy: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/credit-score/stats/overview
 * @desc    Get credit score statistics overview
 * @access  Private (Admin)
 */
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get credit score distribution
    const distribution = await User.aggregate([
      {
        $group: {
            _id: {
              $switch: {
              branches: [
                { case: { $gte: ['$creditScore', 750] }, then: 'Excellent (750+)' },
                { case: { $gte: ['$creditScore', 700] }, then: 'Good (700-749)' },
                { case: { $gte: ['$creditScore', 650] }, then: 'Fair (650-699)' },
                { case: { $gte: ['$creditScore', 600] }, then: 'Poor (600-649)' },
                { case: { $gte: ['$creditScore', 0] }, then: 'Very Poor (<600)' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$creditScore' }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    // Get overall statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgCreditScore: { $avg: '$creditScore' },
          minCreditScore: { $min: '$creditScore' },
          maxCreditScore: { $max: '$creditScore' },
          kycVerifiedCount: {
            $sum: { $cond: ['$kycVerified', 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        distribution,
        overallStats: stats[0] || {}
      }
    });
  } catch (error) {
    logger.error('Failed to get credit score stats via API', {
      error: error.message,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
