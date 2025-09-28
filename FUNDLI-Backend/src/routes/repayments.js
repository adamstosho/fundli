const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const repaymentService = require('../services/repaymentService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/repayments/process-scheduled
 * @desc    Process all scheduled payments
 * @access  Private (Admin)
 */
router.post('/process-scheduled', adminAuth, async (req, res) => {
  try {
    const result = await repaymentService.processScheduledPayments();

    logger.info('Scheduled payments processed via API', {
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      processedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Scheduled payments processing completed',
      data: result
    });
  } catch (error) {
    logger.error('Failed to process scheduled payments via API', {
      error: error.message,
      processedBy: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/repayments/send-reminders
 * @desc    Send payment reminders
 * @access  Private (Admin)
 */
router.post('/send-reminders', adminAuth, async (req, res) => {
  try {
    const result = await repaymentService.sendPaymentReminders();

    logger.info('Payment reminders sent via API', {
      sent: result.sent,
      failed: result.failed,
      sentBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment reminders sent',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send payment reminders via API', {
      error: error.message,
      sentBy: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/repayments/loan/:loanId/process
 * @desc    Process payment for a specific loan
 * @access  Private (Admin)
 */
router.post('/loan/:loanId/process', adminAuth, async (req, res) => {
  try {
    const loanId = req.params.loanId;
    
    const Loan = require('../models/Loan');
    const loan = await Loan.findById(loanId).populate('borrowerId', 'email firstName lastName');
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    const result = await repaymentService.processLoanPayment(loan);

    logger.info('Loan payment processed via API', {
      loanId,
      success: result.success,
      amount: result.amount,
      processedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: result.success ? 'Payment processed successfully' : 'Payment processing failed',
      data: result
    });
  } catch (error) {
    logger.error('Failed to process loan payment via API', {
      error: error.message,
      loanId: req.params.loanId,
      processedBy: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/repayments/overdue
 * @desc    Get overdue payments
 * @access  Private (Admin)
 */
router.get('/overdue', adminAuth, async (req, res) => {
  try {
    const Loan = require('../models/Loan');
    const now = new Date();
    
    const overdueLoans = await Loan.find({
      status: 'active',
      'repayments.status': 'pending',
      'repayments.dueDate': { $lt: now }
    })
    .populate('borrowerId', 'firstName lastName email phone')
    .populate('lenderId', 'firstName lastName email')
    .sort({ 'repayments.dueDate': 1 });

    // Process overdue loans to get detailed payment info
    const overduePayments = [];
    
    for (const loan of overdueLoans) {
      const overduePayment = loan.repayments.find(repayment => 
        repayment.status === 'pending' && repayment.dueDate < now
      );
      
      if (overduePayment) {
        const daysOverdue = Math.floor((now - overduePayment.dueDate) / (1000 * 60 * 60 * 24));
        const lateFee = repaymentService.calculateLateFee(overduePayment.amount, daysOverdue);
        
        overduePayments.push({
          loanId: loan._id,
          paymentId: overduePayment._id,
          borrower: loan.borrowerId,
          lender: loan.lenderId,
          amount: overduePayment.amount,
          dueDate: overduePayment.dueDate,
          daysOverdue,
          lateFee,
          installmentNumber: overduePayment.installmentNumber,
          loanPurpose: loan.purpose
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { overduePayments }
    });
  } catch (error) {
    logger.error('Failed to get overdue payments via API', {
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
 * @route   GET /api/repayments/upcoming
 * @desc    Get upcoming payments
 * @access  Private (Admin)
 */
router.get('/upcoming', adminAuth, async (req, res) => {
  try {
    const Loan = require('../models/Loan');
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingLoans = await Loan.find({
      status: 'active',
      'repayments.status': 'pending',
      'repayments.dueDate': { 
        $gte: now,
        $lte: nextWeek
      }
    })
    .populate('borrowerId', 'firstName lastName email phone')
    .populate('lenderId', 'firstName lastName email')
    .sort({ 'repayments.dueDate': 1 });

    // Process upcoming loans to get detailed payment info
    const upcomingPayments = [];
    
    for (const loan of upcomingLoans) {
      const upcomingPayment = loan.repayments.find(repayment => 
        repayment.status === 'pending' && 
        repayment.dueDate >= now && 
        repayment.dueDate <= nextWeek
      );
      
      if (upcomingPayment) {
        const daysUntilDue = Math.ceil((upcomingPayment.dueDate - now) / (1000 * 60 * 60 * 24));
        
        upcomingPayments.push({
          loanId: loan._id,
          paymentId: upcomingPayment._id,
          borrower: loan.borrowerId,
          lender: loan.lenderId,
          amount: upcomingPayment.amount,
          dueDate: upcomingPayment.dueDate,
          daysUntilDue,
          installmentNumber: upcomingPayment.installmentNumber,
          loanPurpose: loan.purpose
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { upcomingPayments }
    });
  } catch (error) {
    logger.error('Failed to get upcoming payments via API', {
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
 * @route   GET /api/repayments/user/:userId
 * @desc    Get user's repayment history
 * @access  Private
 */
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const Loan = require('../models/Loan');
    const loans = await Loan.find({ borrowerId: userId })
      .populate('lenderId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Process loans to get repayment details
    const repaymentHistory = [];
    
    for (const loan of loans) {
      if (loan.repayments && loan.repayments.length > 0) {
        loan.repayments.forEach(repayment => {
          repaymentHistory.push({
            loanId: loan._id,
            paymentId: repayment._id,
            lender: loan.lenderId,
            amount: repayment.amount,
            amountPaid: repayment.amountPaid,
            dueDate: repayment.dueDate,
            paidAt: repayment.paidAt,
            status: repayment.status,
            installmentNumber: repayment.installmentNumber,
            lateFee: repayment.lateFee,
            loanPurpose: loan.purpose,
            loanStatus: loan.status
          });
        });
      }
    }

    // Sort by due date (most recent first)
    repaymentHistory.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    res.status(200).json({
      status: 'success',
      data: { repaymentHistory }
    });
  } catch (error) {
    logger.error('Failed to get user repayment history via API', {
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
 * @route   GET /api/repayments/stats
 * @desc    Get repayment statistics
 * @access  Private (Admin)
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const Loan = require('../models/Loan');
    const Transaction = require('../models/Transaction');
    
    // Get loan statistics
    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: 1 }
        }
      }
    ]);

    // Get repayment statistics
    const repaymentStats = await Loan.aggregate([
      { $unwind: null },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      {
        $match: {
          type: 'loan_repayment',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRepayments: { $sum: 1 },
          totalAmount: { $sum: 1 },
          avgAmount: { $avg: 1 }
        }
      }
    ]);

    // Get overdue statistics
    const now = new Date();
    const overdueCount = await Loan.countDocuments({
      status: 'active',
      'repayments.status': 'pending',
      'repayments.dueDate': { $lt: now }
    });

    res.status(200).json({
      status: 'success',
      data: {
        loanStats,
        repaymentStats,
        transactionStats: transactionStats[0] || {},
        overdueCount
      }
    });
  } catch (error) {
    logger.error('Failed to get repayment stats via API', {
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
 * @route   POST /api/repayments/loan/:loanId/remind
 * @desc    Send payment reminder for a specific loan
 * @access  Private (Admin)
 */
router.post('/loan/:loanId/remind', adminAuth, async (req, res) => {
  try {
    const loanId = req.params.loanId;
    
    const Loan = require('../models/Loan');
    const loan = await Loan.findById(loanId).populate('borrowerId', 'email firstName lastName');
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    // Find the next due payment
    const nextPayment = loan.repayments.find(repayment => repayment.status === 'pending');
    
    if (!nextPayment) {
      return res.status(400).json({
        status: 'error',
        message: 'No pending payments found for this loan'
      });
    }

    await repaymentService.sendPaymentReminder(loan, nextPayment);

    logger.info('Payment reminder sent via API', {
      loanId,
      paymentId: nextPayment._id,
      borrowerEmail: loan.borrowerId.email,
      sentBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment reminder sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send payment reminder via API', {
      error: error.message,
      loanId: req.params.loanId,
      sentBy: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
