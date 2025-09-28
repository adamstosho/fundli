const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const {
  createWallet,
  getWallet,
  getWalletTransactions,
  depositFunds,
  verifyDeposit,
  withdrawFunds,
  transferFunds,
  getWalletStats,
  getApprovedBorrowers
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

// @route   GET /api/wallet/approved-borrowers
// @desc    Get approved borrowers for transfer suggestions
// @access  Private
router.get('/approved-borrowers', protect, getApprovedBorrowers);

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

// @route   POST /api/wallet/test-add-funds
// @desc    Add test funds to wallet (development only)
// @access  Private
router.post('/test-add-funds', protect, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ status: 'error', message: 'Not allowed in production' });
  }
  
  try {
    const userId = req.user.id;
    const { amount = 1000 } = req.body;
    
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ status: 'error', message: 'Wallet not found' });
    }
    
    wallet.balance += amount;
    await wallet.save();
    
    res.json({
      status: 'success',
      message: `Added ₦${amount} test funds to wallet`,
      data: { wallet: { balance: wallet.balance } }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add test funds' });
  }
});

module.exports = router;
