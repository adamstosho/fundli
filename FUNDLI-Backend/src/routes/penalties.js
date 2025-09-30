const express = require('express');
const router = express.Router();
const penaltyService = require('../services/penaltyService');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { body, validationResult } = require('express-validator');
const Loan = require('../models/Loan');
const logger = require('../utils/logger');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/penalties/summary/:loanId
 * @desc    Get penalty summary for a specific loan
 * @access  Private (Borrower, Lender, Admin)
 */
router.get('/summary/:loanId', auth, async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Find the loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Check if user has access to this loan
    if (userType === 'borrower' && loan.borrower.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (userType === 'lender' && loan.fundedBy && loan.fundedBy.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Get penalty summary
    const penaltySummary = await penaltyService.getPenaltySummary(loanId);

    res.status(200).json({
      status: 'success',
      data: penaltySummary
    });
  } catch (error) {
    logger.error('Error getting penalty summary', {
      error: error.message,
      loanId: req.params.loanId,
      userId: req.user.id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get penalty summary',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/penalties/loan/:loanId
 * @desc    Get detailed penalty information for a loan
 * @access  Private (Borrower, Lender, Admin)
 */
router.get('/loan/:loanId', auth, async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Find the loan with populated data
    const loan = await Loan.findById(loanId)
      .populate('borrower', 'firstName lastName email')
      .populate('fundedBy', 'firstName lastName email');

    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Check if user has access to this loan
    if (userType === 'borrower' && loan.borrower._id.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    if (userType === 'lender' && loan.fundedBy && loan.fundedBy._id.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Calculate current penalties
    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    
    const overdueRepayments = loan.repayments.filter(repayment => 
      repayment.status === 'overdue' && 
      repayment.dueDate < gracePeriodEnd
    );

    let totalCurrentPenalties = 0;
    const penaltyDetails = [];

    for (const repayment of overdueRepayments) {
      const penaltyResult = await penaltyService.calculateRepaymentPenalty(repayment, loan, now);
      
      if (penaltyResult.penaltyAmount > 0) {
        totalCurrentPenalties += penaltyResult.penaltyAmount;
        
        penaltyDetails.push({
          installmentNumber: repayment.installmentNumber,
          dueDate: repayment.dueDate,
          originalAmount: repayment.amount,
          penaltyCharges: repayment.penaltyCharges || 0,
          currentPenalty: penaltyResult.penaltyAmount,
          totalPenaltyCharges: penaltyResult.totalPenaltyCharges,
          daysOverdue: penaltyResult.daysOverdue,
          dailyPenaltyAmount: penaltyResult.dailyPenaltyAmount
        });
      }
    }

    const response = {
      loanId: loan._id,
      borrower: {
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        email: loan.borrower.email
      },
      lender: loan.fundedBy ? {
        name: `${loan.fundedBy.firstName} ${loan.fundedBy.lastName}`,
        email: loan.fundedBy.email
      } : null,
      loanAmount: loan.loanAmount,
      totalPenaltyCharges: loan.totalPenaltyCharges || 0,
      currentPenaltyAmount: totalCurrentPenalties,
      penaltyRate: 0.5, // 0.5% per day
      gracePeriodHours: 24,
      overdueRepayments: penaltyDetails,
      nextPenaltyCalculation: new Date(now.getTime() + (24 * 60 * 60 * 1000)) // Next day
    };

    res.status(200).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    logger.error('Error getting loan penalty details', {
      error: error.message,
      loanId: req.params.loanId,
      userId: req.user.id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get loan penalty details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/penalties/calculate
 * @desc    Manually trigger penalty calculation for all loans
 * @access  Admin only
 */
router.post('/calculate', adminAuth, async (req, res) => {
  try {
    logger.info('Manual penalty calculation triggered', {
      adminId: req.user.id,
      timestamp: new Date()
    });

    const result = await penaltyService.calculatePenaltyCharges();

    res.status(200).json({
      status: 'success',
      message: 'Penalty calculation completed',
      data: result
    });
  } catch (error) {
    logger.error('Error in manual penalty calculation', {
      error: error.message,
      adminId: req.user.id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate penalties',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/penalties/calculate/:loanId
 * @desc    Manually trigger penalty calculation for a specific loan
 * @access  Admin only
 */
router.post('/calculate/:loanId', adminAuth, async (req, res) => {
  try {
    const { loanId } = req.params;

    // Find the loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    logger.info('Manual penalty calculation triggered for specific loan', {
      adminId: req.user.id,
      loanId: loanId,
      timestamp: new Date()
    });

    const result = await penaltyService.calculateLoanPenalties(loan);

    res.status(200).json({
      status: 'success',
      message: 'Penalty calculation completed for loan',
      data: {
        loanId: loanId,
        penaltyApplied: result.penaltyApplied,
        penaltyAmount: result.penaltyAmount,
        overdueRepayments: result.overdueRepayments
      }
    });
  } catch (error) {
    logger.error('Error in manual penalty calculation for loan', {
      error: error.message,
      loanId: req.params.loanId,
      adminId: req.user.id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate penalties for loan',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/penalties/overdue
 * @desc    Get all loans with overdue penalties
 * @access  Admin only
 */
router.get('/overdue', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    // Build query
    let query = {
      status: 'active',
      'repayments.status': 'overdue',
      'repayments.dueDate': { $lt: gracePeriodEnd }
    };

    // Add status filter if provided
    if (status !== 'all') {
      query.status = status;
    }

    // Find overdue loans with penalties
    const overdueLoans = await Loan.find(query)
      .populate('borrower', 'firstName lastName email')
      .populate('fundedBy', 'firstName lastName email')
      .sort({ 'repayments.dueDate': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Loan.countDocuments(query);

    // Calculate penalty details for each loan
    const loansWithPenalties = await Promise.all(
      overdueLoans.map(async (loan) => {
        const penaltyResult = await penaltyService.calculateLoanPenalties(loan, now);
        
        return {
          loanId: loan._id,
          borrower: {
            name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
            email: loan.borrower.email
          },
          lender: loan.fundedBy ? {
            name: `${loan.fundedBy.firstName} ${loan.fundedBy.lastName}`,
            email: loan.fundedBy.email
          } : null,
          loanAmount: loan.loanAmount,
          totalPenaltyCharges: loan.totalPenaltyCharges || 0,
          currentPenaltyAmount: penaltyResult.penaltyAmount,
          overdueRepayments: penaltyResult.overdueRepayments,
          nextPaymentDate: loan.nextPaymentDate,
          status: loan.status
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        loans: loansWithPenalties,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount: totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error getting overdue loans with penalties', {
      error: error.message,
      adminId: req.user.id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get overdue loans with penalties',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/penalties/stats
 * @desc    Get penalty statistics
 * @access  Admin only
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    // Get penalty statistics
    const stats = await Loan.aggregate([
      {
        $match: {
          status: 'active',
          'repayments.status': 'overdue',
          'repayments.dueDate': { $lt: gracePeriodEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalLoansWithPenalties: { $sum: 1 },
          totalPenaltyCharges: { $sum: '$totalPenaltyCharges' },
          averagePenaltyPerLoan: { $avg: '$totalPenaltyCharges' }
        }
      }
    ]);

    // Get total overdue loans
    const totalOverdueLoans = await Loan.countDocuments({
      status: 'active',
      'repayments.status': 'overdue'
    });

    // Get loans with penalties
    const loansWithPenalties = await Loan.countDocuments({
      status: 'active',
      'repayments.status': 'overdue',
      'repayments.dueDate': { $lt: gracePeriodEnd },
      totalPenaltyCharges: { $gt: 0 }
    });

    const response = {
      totalOverdueLoans: totalOverdueLoans,
      loansWithPenalties: loansWithPenalties,
      totalPenaltyCharges: stats[0]?.totalPenaltyCharges || 0,
      averagePenaltyPerLoan: stats[0]?.averagePenaltyPerLoan || 0,
      penaltyRate: 0.5, // 0.5% per day
      gracePeriodHours: 24,
      lastUpdated: now
    };

    res.status(200).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    logger.error('Error getting penalty statistics', {
      error: error.message,
      adminId: req.user.id
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get penalty statistics',
      error: error.message
    });
  }
});

module.exports = router;
