const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const escrowService = require('../services/escrowService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/escrow/create
 * @desc    Create escrow account for a loan
 * @access  Private (Lender)
 */
router.post('/create', protect, async (req, res) => {
  try {
    const { loanId, amount } = req.body;
    const lenderId = req.user.id;

    // Validate input
    if (!loanId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Loan ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0'
      });
    }

    // Create escrow
    const escrow = await escrowService.createEscrow({
      loanId,
      lenderId,
      borrowerId: req.body.borrowerId, // Should be validated from loan
      amount
    });

    logger.info('Escrow created via API', {
      escrowId: escrow._id,
      loanId,
      lenderId,
      amount
    });

    res.status(201).json({
      status: 'success',
      message: 'Escrow created successfully',
      data: { escrow }
    });
  } catch (error) {
    logger.error('Failed to create escrow via API', {
      error: error.message,
      userId: req.user.id,
      body: req.body
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/:id/fund
 * @desc    Fund escrow account
 * @access  Private (Lender)
 */
router.post('/:id/fund', protect, async (req, res) => {
  try {
    const escrowId = req.params.id;
    const paymentData = req.body;

    // Verify escrow belongs to user
    const escrow = await escrowService.getEscrowById(escrowId);
    if (!escrow || escrow.lenderId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Fund escrow
    const result = await escrowService.fundEscrow(escrowId, paymentData);

    logger.info('Escrow funding initiated via API', {
      escrowId,
      userId: req.user.id,
      amount: escrow.amount
    });

    res.status(200).json({
      status: 'success',
      message: 'Escrow funding initiated',
      data: result
    });
  } catch (error) {
    logger.error('Failed to fund escrow via API', {
      error: error.message,
      escrowId: req.params.id,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/verify-payment
 * @desc    Verify escrow payment
 * @access  Public (Webhook)
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment reference is required'
      });
    }

    // Verify payment
    const result = await escrowService.verifyEscrowPayment(reference);

    logger.info('Escrow payment verified via API', {
      reference,
      success: result.success
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verification completed',
      data: result
    });
  } catch (error) {
    logger.error('Failed to verify escrow payment via API', {
      error: error.message,
      reference: req.body.reference
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/escrow/:id/conditions
 * @desc    Update escrow conditions
 * @access  Private (Admin)
 */
router.put('/:id/conditions', adminAuth, async (req, res) => {
  try {
    const escrowId = req.params.id;
    const conditions = req.body;

    // Update conditions
    const escrow = await escrowService.updateEscrowConditions(escrowId, conditions);

    logger.info('Escrow conditions updated via API', {
      escrowId,
      conditions,
      updatedBy: req.user.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Escrow conditions updated',
      data: { escrow }
    });
  } catch (error) {
    logger.error('Failed to update escrow conditions via API', {
      error: error.message,
      escrowId: req.params.id,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/:id/release
 * @desc    Manually release escrow funds
 * @access  Private (Admin)
 */
router.post('/:id/release', adminAuth, async (req, res) => {
  try {
    const escrowId = req.params.id;
    const { reason } = req.body;
    const releasedBy = req.user.id;

    // Release funds
    const result = await escrowService.manualReleaseEscrow(escrowId, releasedBy, reason);

    logger.info('Escrow funds released manually via API', {
      escrowId,
      releasedBy,
      reason,
      amount: result.amount
    });

    res.status(200).json({
      status: 'success',
      message: 'Funds released successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to release escrow funds via API', {
      error: error.message,
      escrowId: req.params.id,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/escrow/:id/refund
 * @desc    Refund escrow funds
 * @access  Private (Admin)
 */
router.post('/:id/refund', adminAuth, async (req, res) => {
  try {
    const escrowId = req.params.id;
    const { reason } = req.body;
    const refundedBy = req.user.id;

    // Refund funds
    const result = await escrowService.refundEscrow(escrowId, refundedBy, reason);

    logger.info('Escrow funds refunded via API', {
      escrowId,
      refundedBy,
      reason,
      amount: result.amount
    });

    res.status(200).json({
      status: 'success',
      message: 'Funds refunded successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to refund escrow funds via API', {
      error: error.message,
      escrowId: req.params.id,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/escrow/stats
 * @desc    Get escrow statistics
 * @access  Private (Admin)
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await escrowService.getEscrowStats();

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get escrow stats via API', {
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
 * @route   GET /api/escrow/ready-to-release
 * @desc    Get escrows ready to release
 * @access  Private (Admin)
 */
router.get('/ready-to-release', adminAuth, async (req, res) => {
  try {
    const Escrow = require('../models/Escrow');
    const escrows = await Escrow.findReadyToRelease()
      .populate('loanId', 'purpose amount status')
      .populate('lenderId', 'firstName lastName email')
      .populate('borrowerId', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      data: { escrows }
    });
  } catch (error) {
    logger.error('Failed to get ready-to-release escrows via API', {
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
 * @route   GET /api/escrow/user/:userId
 * @desc    Get escrows for a specific user
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

    const Escrow = require('../models/Escrow');
    const escrows = await Escrow.find({
      $or: [
        { lenderId: userId },
        { borrowerId: userId }
      ]
    })
    .populate('loanId', 'purpose amount status')
    .populate('lenderId', 'firstName lastName email')
    .populate('borrowerId', 'firstName lastName email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { escrows }
    });
  } catch (error) {
    logger.error('Failed to get user escrows via API', {
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
 * @route   GET /api/escrow/:id
 * @desc    Get specific escrow details
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const escrowId = req.params.id;
    const Escrow = require('../models/Escrow');
    
    const escrow = await Escrow.findById(escrowId)
      .populate('loanId', 'purpose amount status')
      .populate('lenderId', 'firstName lastName email')
      .populate('borrowerId', 'firstName lastName email');

    if (!escrow) {
      return res.status(404).json({
        status: 'error',
        message: 'Escrow not found'
      });
    }

    // Check if user has access to this escrow
    if (req.user.id !== escrow.lenderId._id.toString() && 
        req.user.id !== escrow.borrowerId._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { escrow }
    });
  } catch (error) {
    logger.error('Failed to get escrow details via API', {
      error: error.message,
      escrowId: req.params.id,
      userId: req.user.id
    });

    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
