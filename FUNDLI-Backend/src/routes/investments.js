const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const LendingPool = require('../models/LendingPool');
const Loan = require('../models/Loan');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get investments for a specific lender
// @route   GET /api/investments/lender
// @access  Private
router.get('/lender', protect, async (req, res) => {
  try {
    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can access investment data'
      });
    }

    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = { investor: req.user.id };
    if (status) filter.status = status;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get investments
    const investments = await Investment.find(filter)
      .populate('lendingPool', 'name description category riskLevel')
      .populate('loan', 'loanAmount purpose borrower')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Investment.countDocuments(filter);

    // Get investment statistics
    const stats = await Investment.getUserInvestmentStats(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        investments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching lender investments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch investment data',
      error: error.message
    });
  }
});

// @desc    Get specific investment details
// @route   GET /api/investments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id)
      .populate('investor', 'firstName lastName email')
      .populate('lendingPool', 'name description category riskLevel creator')
      .populate('loan', 'loanAmount purpose borrower status')
      .populate('createdBy', 'firstName lastName');

    if (!investment) {
      return res.status(404).json({
        status: 'error',
        message: 'Investment not found'
      });
    }

    // Check if user has access to this investment
    if (investment.investor._id.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        investment
      }
    });

  } catch (error) {
    console.error('Get investment details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get investment details',
      error: error.message
    });
  }
});

// @desc    Create new investment
// @route   POST /api/investments
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      lendingPoolId,
      loanId,
      amount,
      terms
    } = req.body;

    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can make investments'
      });
    }

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid investment amount is required'
      });
    }

    if (!lendingPoolId && !loanId) {
      return res.status(400).json({
        status: 'error',
        message: 'Either lending pool or loan must be specified'
      });
    }

    let investmentTarget;
    let interestRate;
    let duration;
    let riskLevel;
    let category;

    // Get investment target details
    if (lendingPoolId) {
      investmentTarget = await LendingPool.findById(lendingPoolId);
      if (!investmentTarget) {
        return res.status(404).json({
          status: 'error',
          message: 'Lending pool not found'
        });
      }
      interestRate = investmentTarget.interestRate;
      duration = investmentTarget.duration;
      riskLevel = investmentTarget.riskLevel;
      category = investmentTarget.category;
    } else if (loanId) {
      investmentTarget = await Loan.findById(loanId);
      if (!investmentTarget) {
        return res.status(404).json({
          status: 'error',
          message: 'Loan not found'
        });
      }
      interestRate = investmentTarget.interestRate || 15; // Default interest rate
      duration = investmentTarget.duration;
      riskLevel = investmentTarget.riskLevel || 'medium';
      category = investmentTarget.category || 'personal';
    }

    // Calculate expected return
    const expectedReturn = (amount * interestRate * duration) / (100 * 12); // Monthly calculation

    // Calculate maturity date
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + duration);

    // Create payment schedule
    const paymentSchedule = [];
    const monthlyPayment = (amount + expectedReturn) / duration;
    const monthlyInterest = expectedReturn / duration;
    const monthlyPrincipal = amount / duration;

    for (let i = 0; i < duration; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      
      paymentSchedule.push({
        dueDate,
        amount: monthlyPayment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        status: 'pending'
      });
    }

    // Create investment
    const investment = await Investment.create({
      investor: req.user.id,
      lendingPool: lendingPoolId,
      loan: loanId,
      amount,
      interestRate,
      expectedReturn,
      maturityDate,
      paymentSchedule,
      riskLevel,
      category,
      terms: terms || {},
      createdBy: req.user.id
    });

    // Update lending pool funding progress if applicable
    if (lendingPoolId) {
      await LendingPool.findByIdAndUpdate(lendingPoolId, {
        $inc: { 'fundingProgress.fundedAmount': amount },
        $push: { 
          investors: {
            user: req.user.id,
            amount,
            investedAt: new Date()
          }
        }
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Investment created successfully',
      data: {
        investment
      }
    });

  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create investment',
      error: error.message
    });
  }
});

// @desc    Update investment status
// @route   PUT /api/investments/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['pending', 'active', 'completed', 'defaulted', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        status: 'error',
        message: 'Investment not found'
      });
    }

    // Check permissions
    if (investment.investor.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Update investment
    investment.status = status;
    if (notes) investment.notes = notes;
    investment.updatedBy = req.user.id;

    await investment.save();

    res.status(200).json({
      status: 'success',
      message: 'Investment status updated successfully',
      data: {
        investment
      }
    });

  } catch (error) {
    console.error('Update investment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update investment status',
      error: error.message
    });
  }
});

// @desc    Record payment received
// @route   POST /api/investments/:id/payment
// @access  Private
router.post('/:id/payment', protect, async (req, res) => {
  try {
    const { paymentId, amount, date } = req.body;

    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({
        status: 'error',
        message: 'Investment not found'
      });
    }

    // Check permissions (admin or borrower making payment)
    if (req.user.userType !== 'admin' && req.user.userType !== 'borrower') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Mark payment as received
    await investment.markPaymentReceived(paymentId, amount, date ? new Date(date) : new Date());

    res.status(200).json({
      status: 'success',
      message: 'Payment recorded successfully',
      data: {
        investment
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

// @desc    Get investment performance analytics
// @route   GET /api/investments/analytics/performance
// @access  Private
router.get('/analytics/performance', protect, async (req, res) => {
  try {
    // Check if user is a lender
    if (req.user.userType !== 'lender') {
      return res.status(403).json({
        status: 'error',
        message: 'Only lenders can access performance analytics'
      });
    }

    const { period = '12' } = req.query; // months
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(period));

    // Get performance data
    const performanceData = await Investment.aggregate([
      {
        $match: {
          investor: req.user._id,
          createdAt: { $gte: monthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalInvested: { $sum: '$amount' },
          totalReturns: { $sum: '$returnsReceived' },
          averageReturn: { $avg: '$performance.returnPercentage' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get category distribution
    const categoryDistribution = await Investment.aggregate([
      { $match: { investor: req.user._id } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          totalReturns: { $sum: '$returnsReceived' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get risk level distribution
    const riskDistribution = await Investment.aggregate([
      { $match: { investor: req.user._id } },
      {
        $group: {
          _id: '$riskLevel',
          totalAmount: { $sum: '$amount' },
          totalReturns: { $sum: '$returnsReceived' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        performanceData,
        categoryDistribution,
        riskDistribution
      }
    });

  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance analytics',
      error: error.message
    });
  }
});

// @desc    Get upcoming payments
// @route   GET /api/investments/upcoming-payments
// @access  Private
router.get('/upcoming-payments', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const investments = await Investment.find({
      investor: req.user.id,
      status: 'active',
      nextPaymentDate: { $lte: futureDate }
    })
    .populate('lendingPool', 'name')
    .populate('loan', 'purpose')
    .sort({ nextPaymentDate: 1 });

    const upcomingPayments = investments.map(investment => {
      const nextPayment = investment.calculateNextPayment();
      return {
        investmentId: investment._id,
        investmentName: investment.lendingPool?.name || investment.loan?.purpose || 'Direct Loan',
        nextPaymentDate: nextPayment?.dueDate,
        amount: nextPayment?.amount,
        principal: nextPayment?.principal,
        interest: nextPayment?.interest,
        daysUntilDue: nextPayment ? Math.ceil((nextPayment.dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null
      };
    }).filter(payment => payment.nextPaymentDate);

    res.status(200).json({
      status: 'success',
      data: {
        upcomingPayments,
        totalAmount: upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0)
      }
    });

  } catch (error) {
    console.error('Get upcoming payments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get upcoming payments',
      error: error.message
    });
  }
});

module.exports = router; 