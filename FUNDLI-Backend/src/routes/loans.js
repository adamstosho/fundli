const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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

module.exports = router; 