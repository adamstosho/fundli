const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const ReferralService = require('../services/referralService');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/kyc/pending
// @desc    Get all pending KYC submissions
// @access  Private (Admin only)
router.get('/kyc/pending', protect, requireAdmin, async (req, res) => {
  try {
    const pendingKYC = await User.find({ 
      kycStatus: 'pending' 
    }).select('firstName lastName email kycDocuments createdAt');

    res.status(200).json({
      status: 'success',
      data: pendingKYC
    });
  } catch (error) {
    console.error('Error fetching pending KYC:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending KYC'
    });
  }
});

// @route   PUT /api/admin/kyc/:userId/approve
// @desc    Approve KYC for a user
// @access  Private (Admin only)
router.put('/kyc/:userId/approve', protect, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'KYC is not in pending status'
      });
    }

    // Update KYC status to approved
    user.kycStatus = 'approved';
    if (notes) {
      user.kycDocuments.adminNotes = notes;
    }
    await user.save();

    // Track referral action for KYC completion
    try {
      await ReferralService.handlePlatformAction(userId, 'kyc_verification');
    } catch (referralError) {
      console.warn('Referral tracking error for KYC approval:', referralError.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'KYC approved successfully',
      data: {
        userId: user._id,
        kycStatus: user.kycStatus,
        approvedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error approving KYC:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve KYC'
    });
  }
});

// @route   PUT /api/admin/kyc/:userId/reject
// @desc    Reject KYC for a user
// @access  Private (Admin only)
router.put('/kyc/:userId/reject', protect, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.kycStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'KYC is not in pending status'
      });
    }

    // Update KYC status to rejected
    user.kycStatus = 'rejected';
    user.kycDocuments.rejectionReason = reason;
    user.kycDocuments.rejectedAt = new Date();
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'KYC rejected successfully',
      data: {
        userId: user._id,
        kycStatus: user.kycStatus,
        rejectedAt: user.kycDocuments.rejectedAt,
        reason
      }
    });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject KYC'
    });
  }
});

// @route   GET /api/admin/referrals/stats
// @desc    Get overall referral statistics
// @access  Private (Admin only)
router.get('/referrals/stats', protect, requireAdmin, async (req, res) => {
  try {
    const Referral = require('../models/Referral');
    
    const totalReferrals = await Referral.countDocuments();
    const pendingReferrals = await Referral.countDocuments({ status: 'pending' });
    const completedReferrals = await Referral.countDocuments({ status: 'completed' });
    const totalRewards = await Referral.aggregate([
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        totalRewards: totalRewards[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referral statistics'
    });
  }
});

module.exports = router; 