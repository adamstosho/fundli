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
    console.log('👤 User email:', req.user.email);
    console.log('👤 User type:', req.user.userType);
    
    // Get user's loans
    const loans = await Loan.find({ borrower: userId }).sort({ createdAt: -1 });
    console.log('📊 Found loans for user:', loans.length);
    loans.forEach((loan, index) => {
      console.log(`  ${index + 1}. ${loan.purpose} - $${loan.loanAmount} - ${loan.status}`);
    });
    
    // Calculate stats - only count funded/active loans for total borrowed
    const fundedLoans = loans.filter(loan => ['active', 'funded', 'disbursed'].includes(loan.status));
    const totalBorrowed = fundedLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const totalRepaid = loans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
    const activeLoans = fundedLoans.length;
    
    console.log('📈 Calculated stats:', {
      totalBorrowed,
      totalRepaid,
      activeLoans,
      totalLoans: loans.length,
      fundedLoansCount: fundedLoans.length
    });
    
    // Get user's credit score
    const user = await User.findById(userId);
    const creditScore = user?.creditScore || 650;
    
    // Get wallet balance
    const wallet = await Wallet.findOne({ user: userId });
    const walletBalance = wallet?.balance || 0;
    
    // Get recent loans (last 5)
    const recentLoans = loans.slice(0, 5).map(loan => ({
      _id: loan._id,
      loanAmount: loan.loanAmount,
      purpose: loan.purpose,
      status: loan.status,
      amountPaid: loan.amountPaid || 0,
      nextPaymentDate: loan.nextPaymentDate,
      createdAt: loan.createdAt
    }));
    
    // Get upcoming payments from active loans
    const upcomingPayments = [];
    const activeLoanList = loans.filter(loan => ['active', 'funded', 'disbursed'].includes(loan.status));
    
    activeLoanList.forEach(loan => {
      if (loan.repayments && loan.repayments.length > 0) {
        const nextPayment = loan.repayments.find(r => r.status === 'pending');
        if (nextPayment) {
          upcomingPayments.push({
            id: nextPayment._id || nextPayment.installmentNumber,
            amount: nextPayment.amount,
            dueDate: nextPayment.dueDate,
            loanPurpose: loan.purpose,
            loanId: loan._id
          });
        }
      }
    });
    
    // Sort upcoming payments by due date
    upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Calculate summary metrics
    const averageLoanAmount = loans.length > 0 ? totalBorrowed / loans.length : 0;
    const repaymentRate = totalBorrowed > 0 ? (totalRepaid / totalBorrowed) * 100 : 0;
    
    // Determine credit score category
    let creditScoreCategory = 'Fair';
    if (creditScore >= 750) creditScoreCategory = 'Excellent';
    else if (creditScore >= 700) creditScoreCategory = 'Good';
    else if (creditScore >= 650) creditScoreCategory = 'Fair';
    else if (creditScore >= 600) creditScoreCategory = 'Poor';
    else creditScoreCategory = 'Very Poor';
    
    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalBorrowed: totalBorrowed,
          activeLoans: activeLoans,
          totalRepaid: totalRepaid,
          creditScore: creditScore,
          walletBalance: walletBalance
        },
        wallet: {
          balance: walletBalance,
          currency: wallet?.currency || 'USD'
        },
        upcomingPayments: upcomingPayments.slice(0, 5), // Limit to 5 upcoming payments
        recentLoans: recentLoans,
        summary: {
          averageLoanAmount: averageLoanAmount,
          repaymentRate: repaymentRate,
          creditScoreCategory: creditScoreCategory
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

// @desc    Get borrower repayment schedule
// @route   GET /api/loans/repayment-schedule
// @access  Private
router.get('/repayment-schedule', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Fetching repayment schedule for user:', userId);
    
    // Get user's active loans
    const loans = await Loan.find({ 
      borrower: userId,
      status: { $in: ['active', 'funded', 'disbursed'] }
    }).sort({ createdAt: -1 });
    
    if (loans.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No active loans found. Please apply for a loan first.'
      });
    }
    
    // Get the most recent active loan
    const loan = loans[0];
    
    // Calculate repayment schedule if not already generated
    if (!loan.repayments || loan.repayments.length === 0) {
      const repayments = [];
      const monthlyRate = loan.interestRate / 100 / 12;
      let remainingBalance = loan.loanAmount;
      
      // Use loan start date or funded date, fallback to current date
      const startDate = loan.startDate || loan.fundedAt || new Date();
      
      for (let i = 1; i <= loan.duration; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = loan.monthlyPayment - interestPayment;
        const newBalance = remainingBalance - principalPayment;
        
        // Calculate proper monthly due date
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        repayments.push({
          installmentNumber: i,
          dueDate: dueDate,
          amount: loan.monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          status: 'pending',
          remainingBalance: Math.max(0, newBalance)
        });
        
        remainingBalance = newBalance;
      }
      
      loan.repayments = repayments;
      await loan.save();
    }
    
    // Calculate summary data
    const totalAmount = loan.totalRepayment || (loan.monthlyPayment * loan.duration);
    const paidAmount = loan.amountPaid || 0;
    const remainingAmount = loan.amountRemaining || (totalAmount - paidAmount);
    const completedPayments = loan.repayments.filter(r => r.status === 'paid').length;
    const totalPayments = loan.repayments.length;
    
    // Find next payment
    const nextPayment = loan.repayments.find(r => r.status === 'pending');
    
    // Update repayment statuses based on current date
    const now = new Date();
    loan.repayments.forEach(repayment => {
      if (repayment.status === 'pending' && new Date(repayment.dueDate) < now) {
        repayment.status = 'overdue';
      }
    });
    
    // Save updated statuses
    await loan.save();
    
    // Format repayment schedule
    const repaymentSchedule = loan.repayments.map(repayment => ({
      id: repayment._id || repayment.installmentNumber,
      installmentNumber: repayment.installmentNumber,
      dueDate: repayment.dueDate,
      amount: repayment.amount,
      principal: repayment.principal,
      interest: repayment.interest,
      remainingBalance: repayment.remainingBalance,
      status: repayment.status,
      paidAt: repayment.paidAt,
      lateFees: repayment.lateFees || 0
    }));
    
    const scheduleData = {
      loanId: loan._id,
      loanAmount: loan.loanAmount,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      monthlyPayment: loan.monthlyPayment,
      interestRate: loan.interestRate,
      duration: loan.duration,
      completedPayments: completedPayments,
      totalPayments: totalPayments,
      nextPayment: nextPayment ? {
        installmentNumber: nextPayment.installmentNumber,
        dueDate: nextPayment.dueDate,
        amount: nextPayment.amount
      } : null,
      repaymentSchedule: repaymentSchedule
    };
    
    res.status(200).json({
      status: 'success',
      data: scheduleData
    });
    
  } catch (error) {
    console.error('❌ Error fetching repayment schedule:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch repayment schedule',
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

    // If no real data, provide sample data for demonstration
    const hasRealData = loans.length > 0;
    if (!hasRealData) {
    const sampleData = {
      '2024-07': { applied: 2, approved: 1, funded: 1 },
      '2024-08': { applied: 3, approved: 2, funded: 1 },
      '2024-09': { applied: 1, approved: 1, funded: 1 },
      '2024-10': { applied: 2, approved: 1, funded: 0 },
      '2024-11': { applied: 1, approved: 0, funded: 0 },
      '2024-12': { applied: 0, approved: 0, funded: 0 }
    };

    Object.keys(sampleData).forEach(key => {
      if (monthlyData[key]) {
        monthlyData[key] = sampleData[key];
      }
    });
    }

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
        // Check repayment status from repayments array
        if (loan.repayments && loan.repayments.length > 0) {
          const now = new Date();
          const overduePayments = loan.repayments.filter(r => 
            r.status === 'overdue' || (r.status === 'pending' && new Date(r.dueDate) < now)
          );
          const latePayments = loan.repayments.filter(r => r.status === 'late');
          const onTimePayments = loan.repayments.filter(r => r.status === 'paid');
          
          if (overduePayments.length > 0) {
            statusCounts.overdue += 1;
          } else if (latePayments.length > 0) {
            statusCounts.late += 1;
          } else if (onTimePayments.length > 0) {
            statusCounts.onTime += 1;
          } else {
            // Check if loan is overdue based on next payment date
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
        } else {
          // Fallback to next payment date check
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
      }
    });

    // If no real data, provide sample data for demonstration
    const hasRealData = loans.length > 0;
    let responseData;
    
    if (hasRealData) {
      responseData = {
        labels: ['On Time', 'Late', 'Overdue', 'Paid'],
        values: [statusCounts.onTime, statusCounts.late, statusCounts.overdue, statusCounts.paid]
      };
    } else {
      responseData = {
      labels: ['On Time', 'Late', 'Overdue', 'Paid'],
      values: [3, 1, 0, 2]
    };
    }

    res.status(200).json({
      status: 'success',
      data: responseData
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

    // Get user's actual credit score
    const creditScore = user.creditScore || 650;
    
    // Create distribution based on user's actual credit score
    const distributionData = {
      labels: ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
      values: [0, 0, 0, 0, 0] // Initialize all to 0
    };

    // Set the user's category to 1 based on their actual credit score
    if (creditScore >= 750) {
      distributionData.values[0] = 1; // Excellent
    } else if (creditScore >= 700) {
      distributionData.values[1] = 1; // Good
    } else if (creditScore >= 650) {
      distributionData.values[2] = 1; // Fair
    } else if (creditScore >= 600) {
      distributionData.values[3] = 1; // Poor
    } else {
      distributionData.values[4] = 1; // Very Poor
    }

    res.status(200).json({
      status: 'success',
      data: distributionData
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