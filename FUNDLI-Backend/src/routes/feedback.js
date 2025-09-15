const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendFeedback,
  getAllFeedback,
  getFeedbackForLoan,
  getFeedbackForUser,
  getMyFeedback,
  markFeedbackAsRead,
  replyToFeedback,
  getFeedbackStats,
  deleteFeedback
} = require('../controllers/feedbackController');

// @desc    Send feedback to borrower or lender
// @route   POST /api/feedback/send
// @access  Private (Admin only)
router.post('/send', protect, sendFeedback);

// @desc    Create feedback (admin only)
// @route   POST /api/feedback
// @access  Private (Admin only)
router.post('/', protect, sendFeedback);

// @desc    Get all feedback for a specific loan
// @route   GET /api/feedback/loan/:loanId
// @access  Private (Admin, Borrower, Lender)
router.get('/loan/:loanId', protect, getFeedbackForLoan);

// @desc    Get all feedback (admin only)
// @route   GET /api/feedback
// @access  Private (Admin only)
router.get('/', protect, getAllFeedback);

// @desc    Get feedback for a specific user
// @route   GET /api/feedback/user/:userId
// @access  Private (All users)
router.get('/user/:userId', protect, getFeedbackForUser);

// @desc    Get my feedback (sent and received)
// @route   GET /api/feedback/my-feedback
// @access  Private (All users)
router.get('/my-feedback', protect, getMyFeedback);

// @desc    Mark feedback as read
// @route   PUT /api/feedback/:feedbackId/read
// @access  Private (Recipient only)
router.put('/:feedbackId/read', protect, markFeedbackAsRead);

// @desc    Reply to feedback
// @route   POST /api/feedback/:feedbackId/reply
// @access  Private (Recipient only)
router.post('/:feedbackId/reply', protect, replyToFeedback);

// @desc    Get feedback statistics
// @route   GET /api/feedback/stats
// @access  Private (Admin only)
router.get('/stats', protect, getFeedbackStats);

// @desc    Delete feedback
// @route   DELETE /api/feedback/:feedbackId
// @access  Private (Sender or Admin)
router.delete('/:feedbackId', protect, deleteFeedback);

module.exports = router;
