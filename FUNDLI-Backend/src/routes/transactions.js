const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateBody, validateQuery, validatePaginationParams, validateObjectId } = require('../middleware/validation');
const PaystackService = require('../services/paystackService');
const { transactionRules } = require('../utils/validation');
const logger = require('../utils/logger');

// @desc    Get user transactions
// @route   GET /api/transactions/user
// @access  Private
router.get('/user', protect, validatePaginationParams(), async (req, res) => {
  try {
    const { page, limit } = req.pagination;
    const { type, status, startDate, endDate } = req.query;

    // Build filter
    const filter = {
      $or: [{ sender: req.user.id }, { recipient: req.user.id }]
    };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions
    const transactions = await Transaction.find(filter)
      .populate('sender', 'firstName lastName email')
      .populate('recipient', 'firstName lastName email')
      .populate('relatedEntities.loan', 'loanAmount purpose')
      .populate('relatedEntities.pool', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Transaction.countDocuments(filter);

    // Get transaction statistics
    const stats = await Transaction.getTransactionStats(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        stats
      }
    });

  } catch (error) {
    logger.error('Get user transactions error', {
      error: error.message,
      userId: req.user.id,
      query: req.query
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get user transactions',
      error: error.message
    });
  }
});

// @desc    Get specific transaction details
// @route   GET /api/transactions/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('sender', 'firstName lastName email')
      .populate('recipient', 'firstName lastName email')
      .populate('relatedEntities.loan', 'loanAmount purpose')
      .populate('relatedEntities.pool', 'name description')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Check if user has access to this transaction
    if (transaction.sender._id.toString() !== req.user.id && 
        transaction.recipient._id.toString() !== req.user.id &&
        req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });

  } catch (error) {
    logger.error('Get transaction details error', {
      error: error.message,
      transactionId: req.params.id,
      userId: req.user.id
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction details',
      error: error.message
    });
  }
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
router.post('/', protect, validateBody(transactionRules), async (req, res) => {
  try {
    const {
      type,
      amount,
      recipient,
      paymentMethod,
      description,
      relatedEntities,
      details
    } = req.body;

    // Validate recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient not found'
      });
    }

    // Check if sender has sufficient balance for certain transaction types
    if (['wallet_withdrawal', 'investment', 'loan_repayment'].includes(type)) {
      const sender = await User.findById(req.user.id);
      if ((sender.walletBalance || 0) < amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient wallet balance'
        });
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      type,
      amount,
      sender: req.user.id,
      recipient,
      paymentMethod,
      description,
      relatedEntities: relatedEntities || {},
      details: details || {},
      createdBy: req.user.id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Log transaction creation
    logger.info('Transaction created', {
      transactionId: transaction.transactionId,
      type: transaction.type,
      amount: transaction.amount,
      sender: req.user.id,
      recipient: recipient
    });

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: {
        transaction
      }
    });

  } catch (error) {
    logger.error('Create transaction error', {
      error: error.message,
      userId: req.user.id,
      transactionData: req.body
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to create transaction',
      error: error.message
    });
  }
});

// @desc    Update transaction status
// @route   PUT /api/transactions/:id/status
// @access  Private (Admin only)
router.put('/:id/status', protect, validateObjectId('id'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update transaction status'
      });
    }

    const { status, notes } = req.body;

    if (!['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid transaction status'
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Update transaction status
    const oldStatus = transaction.status;
    transaction.status = status;
    if (notes) transaction.notes = notes;
    transaction.approvedBy = req.user.id;
    transaction.approvedAt = new Date();

    await transaction.save();

    // Log status change
    logger.info('Transaction status updated', {
      transactionId: transaction.transactionId,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Transaction status updated successfully',
      data: {
        transaction
      }
    });

  } catch (error) {
    logger.error('Update transaction status error', {
      error: error.message,
      transactionId: req.params.id,
      userId: req.user.id
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to update transaction status',
      error: error.message
    });
  }
});

// @desc    Verify payment
// @route   POST /api/transactions/:id/verify
// @access  Private
router.post('/:id/verify', protect, validateObjectId('id'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Check if user has access to this transaction
    if (transaction.sender._id.toString() !== req.user.id && 
        transaction.recipient._id.toString() !== req.user.id &&
        req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // If has Paystack reference, verify against Paystack
    const reference = transaction.paymentDetails?.reference;
    if (reference) {
      const result = await PaystackService.verifyPayment(reference);
      return res.status(200).json({ status: 'success', data: result });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        verified: transaction.status === 'completed'
      }
    });

  } catch (error) {
    logger.error('Verify payment error', {
      error: error.message,
      transactionId: req.params.id,
      userId: req.user.id
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// @desc    Paystack webhook
// @route   POST /api/transactions/webhook/paystack
// @access  Public (verified via signature)
router.post('/webhook/paystack', async (req, res) => {
  try {
    const signature = req.get('x-paystack-signature') || '';
    const result = await PaystackService.processWebhook(req.body, signature);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Paystack webhook error', { error: error.message, body: req.body });
    return res.status(400).json({ status: 'error', message: 'Webhook processing failed' });
  }
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get user transaction stats
    const userStats = await Transaction.getTransactionStats(req.user.id);

    // Get daily stats for the period
    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { recipient: req.user._id }],
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: 1 },
          totalFees: { $sum: '$fee' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get transaction type distribution
    const typeDistribution = await Transaction.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { recipient: req.user._id }],
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        userStats,
        dailyStats,
        typeDistribution,
        period: parseInt(period)
      }
    });

  } catch (error) {
    logger.error('Get transaction stats error', {
      error: error.message,
      userId: req.user.id,
      query: req.query
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction statistics',
      error: error.message
    });
  }
});

// @desc    Get pending transactions (Admin only)
// @route   GET /api/transactions/pending
// @access  Private (Admin only)
router.get('/pending', protect, validatePaginationParams(), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can view pending transactions'
      });
    }

    const { page, limit } = req.pagination;
    const { type } = req.query;

    // Build filter
    const filter = { status: 'pending' };
    if (type) filter.type = type;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get pending transactions
    const transactions = await Transaction.find(filter)
      .populate('sender', 'firstName lastName email')
      .populate('recipient', 'firstName lastName email')
      .populate('relatedEntities.loan', 'loanAmount purpose')
      .populate('relatedEntities.pool', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    logger.error('Get pending transactions error', {
      error: error.message,
      userId: req.user.id,
      query: req.query
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get pending transactions',
      error: error.message
    });
  }
});

// @desc    Reverse transaction (Admin only)
// @route   POST /api/transactions/:id/reverse
// @access  Private (Admin only)
router.post('/:id/reverse', protect, validateObjectId('id'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can reverse transactions'
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Reversal reason is required'
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Only completed transactions can be reversed'
      });
    }

    // Reverse the transaction
    await transaction.reverse(reason, req.user.id);

    // Log reversal
    logger.warn('Transaction reversed', {
      transactionId: transaction.transactionId,
      reason,
      reversedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Transaction reversed successfully',
      data: {
        transaction
      }
    });

  } catch (error) {
    logger.error('Reverse transaction error', {
      error: error.message,
      transactionId: req.params.id,
      userId: req.user.id
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to reverse transaction',
      error: error.message
    });
  }
});

module.exports = router;
