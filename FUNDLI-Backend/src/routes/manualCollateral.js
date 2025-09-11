const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitCollateralVerification,
  getCollateralStatus,
  getPendingVerifications,
  reviewCollateralVerification,
  getCollateralDetails,
  getRejectedVerifications,
  getApprovedVerifications,
  deleteCollateralVerification,
  getDeletedVerifications
} = require('../controllers/manualCollateralController');

// @desc    Submit collateral verification
// @route   POST /api/collateral/submit
// @access  Private (Borrowers only)
router.post('/submit', protect, submitCollateralVerification);

// @desc    Get collateral verification status
// @route   GET /api/collateral/status
// @access  Private (Borrowers only)
router.get('/status', protect, getCollateralStatus);

// @desc    Get all pending collateral verifications
// @route   GET /api/admin/collateral/pending
// @access  Private (Admin only)
router.get('/admin/pending', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  getPendingVerifications(req, res);
});

// @desc    Get collateral verification details
// @route   GET /api/admin/collateral/:id
// @access  Private (Admin only)
router.get('/admin/:id', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  getCollateralDetails(req, res);
});

// @desc    Review collateral verification
// @route   POST /api/admin/collateral/:id/review
// @access  Private (Admin only)
router.post('/admin/:id/review', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  reviewCollateralVerification(req, res);
});

// @desc    Get all rejected collateral verifications
// @route   GET /api/collateral/admin/rejected
// @access  Private (Admin only)
router.get('/admin/rejected', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  getRejectedVerifications(req, res);
});

// @desc    Get all approved collateral verifications
// @route   GET /api/collateral/admin/approved
// @access  Private (Admin only)
router.get('/admin/approved', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  getApprovedVerifications(req, res);
});

// @desc    Delete collateral verification
// @route   DELETE /api/collateral/admin/:id/delete
// @access  Private (Admin only)
router.delete('/admin/:id/delete', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  deleteCollateralVerification(req, res);
});

// @desc    Get all deleted collateral verifications
// @route   GET /api/collateral/admin/deleted
// @access  Private (Admin only)
router.get('/admin/deleted', protect, async (req, res) => {
  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only admins can access this endpoint'
    });
  }
  
  getDeletedVerifications(req, res);
});

module.exports = router;
