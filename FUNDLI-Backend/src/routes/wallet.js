const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createWallet,
  getWallet,
  getWalletTransactions,
  depositFunds,
  verifyDeposit,
  withdrawFunds,
  transferFunds,
  getWalletStats
} = require('../controllers/walletController');

// @route   POST /api/wallet/create
// @desc    Create wallet for user
// @access  Private
router.post('/create', protect, createWallet);

// @route   GET /api/wallet
// @desc    Get wallet details
// @access  Private
router.get('/', protect, getWallet);

// @route   GET /api/wallet/transactions
// @desc    Get wallet transactions
// @access  Private
router.get('/transactions', protect, getWalletTransactions);

// @route   GET /api/wallet/stats
// @desc    Get wallet statistics
// @access  Private
router.get('/stats', protect, getWalletStats);

// @route   POST /api/wallet/deposit
// @desc    Deposit funds to wallet
// @access  Private
router.post('/deposit', protect, depositFunds);

// @route   POST /api/wallet/verify-deposit
// @desc    Verify deposit transaction
// @access  Private
router.post('/verify-deposit', protect, verifyDeposit);

// @route   POST /api/wallet/withdraw
// @desc    Withdraw funds from wallet
// @access  Private
router.post('/withdraw', protect, withdrawFunds);

// @route   POST /api/wallet/transfer
// @desc    Transfer funds to another user
// @access  Private
router.post('/transfer', protect, transferFunds);

module.exports = router;
