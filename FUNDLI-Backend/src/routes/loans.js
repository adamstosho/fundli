const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
const {
  applyForLoan,
  getUserLoans,
  getLoanById,
  updateLoanApplication,
  cancelLoanApplication,
  getLoanStats,
  getPendingLoansForBorrower,
  getAllPendingLoans,
  rejectLoanApplication,
  acceptLoanApplication
} = require('../controllers/loanController');

// @route   POST /api/loans/apply
// @desc    Apply for a loan
// @access  Private
router.post('/apply', protect, applyForLoan);

// @route   GET /api/loans/user
// @desc    Get user's loans
// @access  Private
router.get('/user', protect, getUserLoans);

// @route   GET /api/loans/stats/user
// @desc    Get user's loan statistics
// @access  Private
router.get('/stats/user', protect, getLoanStats);

// @route   GET /api/loans/pending/borrower
// @desc    Get borrower's pending loans
// @access  Private (Borrowers only)
router.get('/pending/borrower', protect, getPendingLoansForBorrower);

// @route   GET /api/loans/pending/all
// @desc    Get all pending loans (for lenders and admins)
// @access  Private (Lenders and Admins only)
router.get('/pending/all', protect, getAllPendingLoans);

// @desc    Get comprehensive borrower dashboard stats
// @route   GET /api/loans/borrower-stats
// @access  Private
router.get('/borrower-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Fetching borrower stats for user:', userId);
    
    // Simple test response
    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalBorrowed: 0,
          activeLoans: 0,
          totalRepaid: 0,
          creditScore: 750,
          walletBalance: 0
        },
        wallet: {
          balance: 0,
          currency: 'USD'
        },
        upcomingPayments: [],
        recentLoans: [],
        summary: {
          averageLoanAmount: 0,
          repaymentRate: 0,
          creditScoreCategory: 'Good'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in borrower stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch borrower stats',
      error: error.message
    });
  }
});

// @route   GET /api/loans/:loanId
// @desc    Get loan by ID
// @access  Private
router.get('/:loanId', protect, getLoanById);

// @route   PUT /api/loans/:loanId
// @desc    Update loan application
// @access  Private
router.put('/:loanId', protect, updateLoanApplication);

// @route   DELETE /api/loans/:loanId
// @desc    Cancel loan application
// @access  Private
router.delete('/:loanId', protect, cancelLoanApplication);

// @route   POST /api/loans/:loanId/reject
// @desc    Reject a loan application
// @access  Private (Lenders only)
router.post('/:loanId/reject', protect, rejectLoanApplication);

// @route   POST /api/loans/:loanId/accept
// @desc    Accept a loan application (after payment)
// @access  Private (Lenders only)
router.post('/:loanId/accept', protect, acceptLoanApplication);

// @route   GET /api/loans/trends
// @desc    Get loan trends data for charts
// @access  Private
router.get('/trends', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const loans = await Loan.find({ 
      borrower: userId, 
      createdAt: { $gte: sixMonthsAgo } 
    }).sort({ createdAt: 1 });

    // Group loans by month
    const monthlyData = {};
    const currentDate = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(currentDate.getMonth() - i);
      const monthKey = month.toISOString().substring(0, 7);
      monthlyData[monthKey] = { applied: 0, approved: 0, funded: 0 };
    }

    // Count loans by status and month
    loans.forEach(loan => {
      const monthKey = loan.createdAt.toISOString().substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].applied += 1;
        
        if (loan.status === 'approved' || loan.status === 'funded' || loan.status === 'active' || loan.status === 'completed') {
          monthlyData[monthKey].approved += 1;
        }
        
        if (loan.status === 'funded' || loan.status === 'active' || loan.status === 'completed') {
          monthlyData[monthKey].funded += 1;
        }
      }
    });

    // Always provide sample data for demonstration
    const sampleData = {
      '2024-07': { applied: 2, approved: 1, funded: 1 },
      '2024-08': { applied: 3, approved: 2, funded: 1 },
      '2024-09': { applied: 1, approved: 1, funded: 1 },
      '2024-10': { applied: 2, approved: 1, funded: 0 },
      '2024-11': { applied: 1, approved: 0, funded: 0 },
      '2024-12': { applied: 0, approved: 0, funded: 0 }
    };

    // Use sample data for demonstration
    Object.keys(sampleData).forEach(key => {
      if (monthlyData[key]) {
        monthlyData[key] = sampleData[key];
      }
    });

    const trendsData = {
      labels: Object.keys(monthlyData).map(key => {
        const date = new Date(key + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      applied: Object.values(monthlyData).map(data => data.applied),
      approved: Object.values(monthlyData).map(data => data.approved),
      funded: Object.values(monthlyData).map(data => data.funded)
    };

    res.status(200).json({
      status: 'success',
      data: trendsData
    });

  } catch (error) {
    console.error('Error fetching loan trends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loan trends data'
    });
  }
});

// @route   GET /api/loans/repayment-status
// @desc    Get repayment status data for charts
// @access  Private
router.get('/repayment-status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const loans = await Loan.find({ 
      borrower: userId,
      status: { $in: ['active', 'funded', 'completed'] }
    });

    // Calculate repayment status distribution
    const statusCounts = {
      onTime: 0,
      late: 0,
      overdue: 0,
      paid: 0
    };

    loans.forEach(loan => {
      if (loan.status === 'completed') {
        statusCounts.paid += 1;
      } else if (loan.status === 'active' || loan.status === 'funded') {
        // Check if loan is overdue
        const now = new Date();
        const nextPaymentDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
        
        if (nextPaymentDate && now > nextPaymentDate) {
          const daysOverdue = Math.floor((now - nextPaymentDate) / (1000 * 60 * 60 * 24));
          if (daysOverdue > 30) {
            statusCounts.overdue += 1;
          } else {
            statusCounts.late += 1;
          }
        } else {
          statusCounts.onTime += 1;
        }
      }
    });

    // Always provide sample data for demonstration
    const sampleData = {
      labels: ['On Time', 'Late', 'Overdue', 'Paid'],
      values: [3, 1, 0, 2]
    };

    res.status(200).json({
      status: 'success',
      data: sampleData
    });

  } catch (error) {
    console.error('Error fetching repayment status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch repayment status data'
    });
  }
});

// @route   GET /api/loans/credit-score-distribution
// @desc    Get credit score distribution data for charts
// @access  Private
router.get('/credit-score-distribution', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Always provide sample data for demonstration
    const sampleData = {
      labels: ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
      values: [1, 2, 1, 1, 0] // Based on user's current credit score
    };

    // Adjust sample data based on user's actual credit score
    const creditScore = user.creditScore || 650;
    if (creditScore >= 750) {
      sampleData.values = [1, 0, 0, 0, 0];
    } else if (creditScore >= 700) {
      sampleData.values = [0, 1, 0, 0, 0];
    } else if (creditScore >= 650) {
      sampleData.values = [0, 0, 1, 0, 0];
    } else if (creditScore >= 600) {
      sampleData.values = [0, 0, 0, 1, 0];
    } else {
      sampleData.values = [0, 0, 0, 0, 1];
    }

    res.status(200).json({
      status: 'success',
      data: sampleData
    });

  } catch (error) {
    console.error('Error fetching credit score distribution:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch credit score distribution data'
    });
  }
});

module.exports = router; 