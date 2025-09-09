const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const matchingService = require('../services/matchingService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/matching/loan/:loanId
 * @desc    Find matches for a specific loan
 * @access  Private
 */
router.get('/loan/:loanId', protect, async (req, res) => {
  try {
    const { loanId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const matches = await matchingService.findLoanMatches(loanId, limit);

    logger.info('Loan matches found', {
      loanId,
      matchesCount: matches.length,
      userId: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Loan matches retrieved successfully',
      data: {
        matches,
        totalMatches: matches.length,
        loanId
      }
    });
  } catch (error) {
    logger.error('Failed to find loan matches', {
      error: error.message,
      loanId: req.params.loanId,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/matching/lender/:lenderId
 * @desc    Find matches for a specific lender
 * @access  Private
 */
router.get('/lender/:lenderId', protect, async (req, res) => {
  try {
    const { lenderId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Check if user is accessing their own matches or is admin
    if (req.user.id !== lenderId && req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view these matches'
      });
    }

    const matches = await matchingService.findLenderMatches(lenderId, limit);

    logger.info('Lender matches found', {
      lenderId,
      matchesCount: matches.length,
      userId: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Lender matches retrieved successfully',
      data: {
        matches,
        totalMatches: matches.length,
        lenderId
      }
    });
  } catch (error) {
    logger.error('Failed to find lender matches', {
      error: error.message,
      lenderId: req.params.lenderId,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/matching/my-matches
 * @desc    Get matches for current user
 * @access  Private
 */
router.get('/my-matches', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const limit = parseInt(req.query.limit) || 10;

    let matches = [];

    if (userType === 'borrower') {
      // Get user's loan applications and their matches
      const Loan = require('../models/Loan');
      const userLoans = await Loan.find({ borrowerId: userId, status: 'pending' });
      
      for (const loan of userLoans) {
        const loanMatches = await matchingService.findLoanMatches(loan._id, limit);
        matches.push({
          loanId: loan._id,
          loanAmount: loan.amount,
          loanPurpose: loan.purpose,
          matches: loanMatches
        });
      }
    } else if (userType === 'lender') {
      matches = await matchingService.findLenderMatches(userId, limit);
    }

    logger.info('User matches retrieved', {
      userId,
      userType,
      matchesCount: matches.length
    });

    res.status(200).json({
      status: 'success',
      message: 'User matches retrieved successfully',
      data: {
        matches,
        totalMatches: matches.length,
        userType
      }
    });
  } catch (error) {
    logger.error('Failed to get user matches', {
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
 * @route   GET /api/matching/stats
 * @desc    Get matching statistics
 * @access  Private (Admin only)
 */
router.get('/stats', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const stats = await matchingService.getMatchingStats();

    logger.info('Matching stats retrieved', {
      userId: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Matching statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get matching stats', {
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
 * @route   POST /api/matching/calculate-score
 * @desc    Calculate compatibility score between borrower and lender
 * @access  Private
 */
router.post('/calculate-score', protect, async (req, res) => {
  try {
    const { borrowerId, lenderId, loanId } = req.body;

    if (!borrowerId || !lenderId || !loanId) {
      return res.status(400).json({
        status: 'error',
        message: 'borrowerId, lenderId, and loanId are required'
      });
    }

    const User = require('../models/User');
    const Loan = require('../models/Loan');

    const borrower = await User.findById(borrowerId);
    const lender = await User.findById(lenderId);
    const loan = await Loan.findById(loanId);

    if (!borrower || !lender || !loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower, lender, or loan not found'
      });
    }

    const compatibilityScore = matchingService.calculateCompatibilityScore(borrower, lender, loan);
    const riskScore = matchingService.calculateRiskScore(borrower);
    const recommendedRate = matchingService.calculateRecommendedInterestRate(borrower, lender, loan);

    logger.info('Compatibility score calculated', {
      borrowerId,
      lenderId,
      loanId,
      compatibilityScore,
      userId: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Compatibility score calculated successfully',
      data: {
        compatibilityScore,
        riskScore,
        recommendedInterestRate: recommendedRate,
        borrowerId,
        lenderId,
        loanId
      }
    });
  } catch (error) {
    logger.error('Failed to calculate compatibility score', {
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
 * @route   PUT /api/matching/weights
 * @desc    Update matching algorithm weights
 * @access  Private (Admin only)
 */
router.put('/weights', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    const { weights } = req.body;

    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Valid weights object is required'
      });
    }

    matchingService.updateWeights(weights);

    logger.info('Matching weights updated', {
      newWeights: weights,
      userId: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Matching weights updated successfully',
      data: {
        weights
      }
    });
  } catch (error) {
    logger.error('Failed to update matching weights', {
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
