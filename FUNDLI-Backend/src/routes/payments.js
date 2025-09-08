const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPaymentIntent, verifyPayment, handlePaystackWebhook } = require('../controllers/paymentController');

// @route   POST /api/payments/create-intent
// @desc    Create payment intent for Paystack
// @access  Private (Lenders only)
router.post('/create-intent', protect, createPaymentIntent);

// @route   POST /api/payments/verify
// @desc    Verify payment with Paystack
// @access  Private (Lenders only)
router.post('/verify', protect, verifyPayment);

// @route   POST /api/payments/webhook
// @desc    Handle Paystack webhook events
// @access  Public (Paystack calls this)
router.post('/webhook', handlePaystackWebhook);

module.exports = router;
