const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  applyForLoan,
  getUserLoans,
  getLoanById,
  updateLoanApplication,
  cancelLoanApplication,
  getLoanStats
} = require('../controllers/loanController');

// @route   POST /api/loans/apply
// @desc    Apply for a loan
// @access  Private
router.post('/apply', protect, applyForLoan);

// @route   GET /api/loans/user
// @desc    Get user's loans
// @access  Private
router.get('/user', protect, getUserLoans);

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

// @route   GET /api/loans/stats/user
// @desc    Get user's loan statistics
// @access  Private
router.get('/stats/user', protect, getLoanStats);

module.exports = router; 