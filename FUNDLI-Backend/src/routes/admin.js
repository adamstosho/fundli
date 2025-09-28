const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const ReferralService = require('../services/referralService');
const NotificationService = require('../services/notificationService');

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


// @route   GET /api/admin/kyc/stats
// @desc    Get comprehensive KYC statistics
// @access  Private (Admin only)
router.get('/kyc/stats', protect, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });
    const approvedKYC = await User.countDocuments({ kycStatus: 'approved' });
    const rejectedKYC = await User.countDocuments({ kycStatus: 'rejected' });
    
    res.status(200).json({
      status: 'success',
      data: {
        total: totalUsers,
        pending: pendingKYC,
        approved: approvedKYC,
        rejected: rejectedKYC
      }
    });
  } catch (error) {
    console.error('Error fetching KYC stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch KYC statistics'
    });
  }
});

// @route   GET /api/admin/kyc/pending
// @desc    Get all pending KYC submissions
// @access  Private (Admin only)
router.get('/kyc/pending', protect, requireAdmin, async (req, res) => {
  try {
    const pendingKYC = await User.find({ 
      kycStatus: 'pending' 
    }).select('firstName lastName email kycDocuments createdAt userType phone kycStatus');

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

// @route   GET /api/admin/kyc/approved
// @desc    Get all approved KYC submissions
// @access  Private (Admin only)
router.get('/kyc/approved', protect, requireAdmin, async (req, res) => {
  try {
    const approvedKYC = await User.find({ 
      kycStatus: 'approved' 
    }).select('firstName lastName email kycDocuments createdAt userType updatedAt phone kycStatus');

    res.status(200).json({
      status: 'success',
      data: approvedKYC
    });
  } catch (error) {
    console.error('Error fetching approved KYC:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch approved KYC'
    });
  }
});

// @route   GET /api/admin/kyc/all
// @desc    Get all KYC submissions (pending, approved, rejected)
// @access  Private (Admin only)
router.get('/kyc/all', protect, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.kycStatus = status;
    }
    
    // Search by name or email if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const allKYC = await User.find(query)
      .select('firstName lastName email kycDocuments createdAt userType kycStatus updatedAt phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: allKYC,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all KYC:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch KYC applications'
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

    // Create notification for KYC approval
    try {
      await NotificationService.notifyKYCDecision({
        userId: userId,
        status: 'approved',
        approvedAt: new Date(),
        rejectionReason: null
      });
      console.log(`📧 KYC approval notification sent for user ${userId}`);
    } catch (notificationError) {
      console.error('Failed to create KYC approval notification:', notificationError);
      // Don't fail the entire transaction if notifications fail
    }

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

    // Create notification for KYC rejection
    try {
      await NotificationService.notifyKYCDecision({
        userId: userId,
        status: 'rejected',
        approvedAt: null,
        rejectionReason: reason
      });
      console.log(`📧 KYC rejection notification sent for user ${userId}`);
    } catch (notificationError) {
      console.error('Failed to create KYC rejection notification:', notificationError);
      // Don't fail the entire transaction if notifications fail
    }

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

// @route   GET /api/admin/kyc/:userId/details
// @desc    Get detailed KYC information for a specific user
// @access  Private (Admin only)
router.get('/kyc/:userId/details', protect, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('firstName lastName email kycDocuments createdAt userType kycStatus updatedAt phone');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Error fetching KYC details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch KYC details'
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
      { $group: { _id: null, total: { $sum: 1 } } }
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

// @route   GET /api/admin/dashboard/stats
// @desc    Get comprehensive admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard/stats', protect, requireAdmin, async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });
    const approvedKYC = await User.countDocuments({ kycStatus: 'approved' });
    const rejectedKYC = await User.countDocuments({ kycStatus: 'rejected' });
    
    // Get user type breakdown
    const borrowers = await User.countDocuments({ userType: 'borrower' });
    const lenders = await User.countDocuments({ userType: 'lender' });
    const admins = await User.countDocuments({ userType: 'admin' });

    // Get loan statistics
    const Loan = require('../models/Loan');
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const approvedLoans = await Loan.countDocuments({ status: 'approved' });
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const completedLoans = await Loan.countDocuments({ status: 'completed' });

    // Get lending pool statistics
    const LendingPool = require('../models/LendingPool');
    const totalPools = await LendingPool.countDocuments();
    const activePools = await LendingPool.countDocuments({ status: 'active' });
    const fundedPools = await LendingPool.countDocuments({ status: 'funded' });

    // Get recent activities (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentUsers = await User.find({ 
      createdAt: { $gte: sevenDaysAgo } 
    }).select('firstName lastName email userType createdAt').sort({ createdAt: -1 }).limit(5);

    const recentLoans = await Loan.find({ 
      createdAt: { $gte: sevenDaysAgo } 
    }).select('loanAmount purpose status createdAt').sort({ createdAt: -1 }).limit(5);

    const recentKYC = await User.find({ 
      'kycDocuments.submittedAt': { $gte: sevenDaysAgo } 
    }).select('firstName lastName email kycStatus createdAt').sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          pendingKYC,
          approvedKYC,
          rejectedKYC,
          breakdown: { borrowers, lenders, admins }
        },
        loans: {
          total: totalLoans,
          pending: pendingLoans,
          approved: approvedLoans,
          active: activeLoans,
          completed: completedLoans
        },
        pools: {
          total: totalPools,
          active: activePools,
          funded: fundedPools
        },
        recentActivities: {
          users: recentUsers,
          loans: recentLoans,
          kyc: recentKYC
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @route   GET /api/admin/users/stats
// @desc    Get user statistics for admin dashboard
// @access  Private (Admin only)
router.get('/users/stats', protect, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingKYC = await User.countDocuments({ kycStatus: 'pending' });
    const approvedKYC = await User.countDocuments({ kycStatus: 'approved' });
    const rejectedKYC = await User.countDocuments({ kycStatus: 'rejected' });
    const borrowers = await User.countDocuments({ userType: 'borrower' });
    const lenders = await User.countDocuments({ userType: 'lender' });
    const admins = await User.countDocuments({ userType: 'admin' });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        pendingKYC,
        approvedKYC,
        rejectedKYC,
        userTypes: {
          borrowers,
          lenders,
          admins
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user statistics'
    });
  }
});

// @route   PUT /api/admin/users/:userId
// @desc    Update user by admin
// @access  Private (Admin only)
router.put('/users/:userId', protect, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, kycStatus, userType } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own status
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify your own account'
      });
    }

    // Update allowed fields
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (kycStatus && ['pending', 'approved', 'rejected'].includes(kycStatus)) {
      user.kycStatus = kycStatus;
    }
    if (userType && ['borrower', 'lender', 'admin'].includes(userType)) {
      user.userType = userType;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        isActive: user.isActive,
        kycStatus: user.kycStatus
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, userType, kycStatus, search, isActive } = req.query;
    
    const query = {};
    
    // Add filters
    if (userType) query.userType = userType;
    if (kycStatus) query.kycStatus = kycStatus;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/admin/loans
// @desc    Get all loans with pagination and filtering
// @access  Private (Admin only)
router.get('/loans', protect, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin fetching loans...');
    const { page = 1, limit = 10, status, purpose, search } = req.query;
    
    const query = {};
    
    // Add filters
    if (status) query.status = status;
    if (purpose) query.purpose = purpose;
    if (search) {
      query.$or = [
        { purpose: { $regex: search, $options: 'i' } },
        { purposeDescription: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔍 Query filters:', query);

    const skip = (page - 1) * limit;
    
    const loans = await Loan.find(query)
      .populate('borrower', 'firstName lastName email')
      .populate({
        path: 'lendingPool',
        select: 'name creator',
        populate: {
          path: 'creator',
          select: 'firstName lastName email userType _id'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(query);

    console.log('📊 Found loans:', loans.length);
    console.log('📊 Total loans in database:', total);
    console.log('📊 Loan statuses:', loans.map(loan => ({ 
      id: loan._id, 
      status: loan.status, 
      borrower: loan.borrower?.firstName,
      lender: loan.lendingPool?.creator?.firstName || 'No lender data'
    })));
    
    // Debug lender data
    loans.forEach((loan, index) => {
      if (loan.lendingPool?.creator) {
        console.log(`🔍 Loan ${index + 1} lender data:`, {
          lenderId: loan.lendingPool.creator._id,
          lenderName: loan.lendingPool.creator.firstName,
          lenderEmail: loan.lendingPool.creator.email,
          lenderType: loan.lendingPool.creator.userType
        });
      } else {
        console.log(`❌ Loan ${index + 1} has no lender data`);
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        loans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalLoans: total,
          loansPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loans'
    });
  }
});

// Removed duplicate PUT endpoint - using POST /api/admin/loan/:id/approve instead

// @route   PUT /api/admin/loans/:loanId/reject
// @desc    Reject a loan application
// @access  Private (Admin only)
router.put('/loans/:loanId/reject', protect, requireAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Loan is not in pending status'
      });
    }

    // Update loan status to rejected
    loan.status = 'rejected';
    loan.rejectionReason = reason;
    loan.rejectedAt = new Date();

    await loan.save();

    // Clear collateral verification restrictions for rejected loans
    try {
      const Collateral = require('../models/Collateral');
      // Update any pending collateral verifications for this borrower to allow new submissions
      await Collateral.updateMany(
        {
          userId: loan.borrower,
          verificationStatus: { $in: ['pending', 'submitted', 'under_review'] }
        },
        {
          verificationStatus: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: `Loan application rejected: ${reason}`
        }
      );
      console.log(`✅ Cleared collateral verification restrictions for borrower ${loan.borrower}`);
    } catch (collateralError) {
      console.error('Failed to clear collateral restrictions:', collateralError);
      // Don't fail the entire operation if collateral clearing fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Loan rejected successfully',
      data: {
        loanId: loan._id,
        status: loan.status,
        rejectedAt: loan.rejectedAt,
        reason
      }
    });

  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject loan'
    });
  }
});

// @desc    Get all loan applications for admin review
// @route   GET /api/admin/loan-applications
// @access  Private (Admin only)
router.get('/loan-applications', protect, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const loans = await Loan.find(filter)
      .populate('borrower', 'firstName lastName email kycStatus kycVerified')
      .populate('fundingProgress.investors.user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(filter);

    // Format response
    const loanApplications = loans.map(loan => ({
      id: loan._id,
      loanAmount: loan.loanAmount,
      purpose: loan.purpose,
      purposeDescription: loan.purposeDescription,
      duration: loan.duration,
      interestRate: loan.interestRate,
      collateral: loan.collateral,
      collateralVerification: loan.collateralVerification,
      status: loan.status,
      kycStatus: loan.kycStatus,
      createdAt: loan.createdAt,
      submittedAt: loan.submittedAt,
      borrower: {
        id: loan.borrower._id,
        name: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        email: loan.borrower.email,
        kycStatus: loan.borrower.kycStatus,
        kycVerified: loan.borrower.kycVerified
      },
      fundingProgress: {
        fundedAmount: loan.fundingProgress?.fundedAmount || 0,
        targetAmount: loan.fundingProgress?.targetAmount || loan.loanAmount,
        investors: loan.fundingProgress?.investors || [],
        fundingPercentage: loan.fundingProgress?.fundedAmount && loan.fundingProgress?.targetAmount ? 
          Math.round((loan.fundingProgress.fundedAmount / loan.fundingProgress.targetAmount) * 100) : 0
      }
    }));

    res.status(200).json({
      status: 'success',
      data: {
        loanApplications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        summary: {
          total: total,
          pending: await Loan.countDocuments({ ...filter, status: 'pending' }),
          approved: await Loan.countDocuments({ ...filter, status: 'approved' }),
          funded: await Loan.countDocuments({ ...filter, status: 'funded' }),
          rejected: await Loan.countDocuments({ ...filter, status: 'rejected' })
        }
      }
    });

  } catch (error) {
    console.error('Get admin loan applications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get loan applications',
      error: error.message
    });
  }
});

// @desc    Approve or reject a loan application (Admin)
// @route   POST /api/admin/loan/:id/approve
// @access  Private (Admin only)
router.post('/loan/:id/approve', protect, requireAdmin, async (req, res) => {
  try {
    console.log('Processing loan approval/rejection for ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const { action, rejectionReason, adminNotes } = req.body; // action: 'approve' or 'reject'

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Action must be either "approve" or "reject"'
      });
    }

    // Validate rejection reason if rejecting
    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required when rejecting loan'
      });
    }

    console.log('Looking for loan with ID:', req.params.id);
    const loan = await Loan.findById(req.params.id).populate('borrower', 'firstName lastName email');
    if (!loan) {
      console.log('Loan not found for ID:', req.params.id);
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    console.log('Loan found. Current status:', loan.status);
    console.log('Borrower:', loan.borrower ? loan.borrower.firstName : 'Not populated');

    // Update loan status
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
      adminNotes: adminNotes || ''
    };

    if (action === 'reject') {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('borrower', 'firstName lastName email');

    // Create notifications for loan approval/rejection
    try {
      if (action === 'approve') {
        // Notify borrower about loan approval
        await NotificationService.notifyLoanApproved({
          borrowerId: loan.borrower._id,
          borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
          loanId: loan._id,
          loanAmount: loan.loanAmount,
          purpose: loan.purpose
        });

        // Notify all lenders about new approved loan
        const lenders = await User.find({ userType: 'lender' });
        for (const lender of lenders) {
          await NotificationService.notifyNewApprovedLoan({
            lenderId: lender._id,
            lenderName: `${lender.firstName} ${lender.lastName}`,
            loanId: loan._id,
            borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
            loanAmount: loan.loanAmount,
            purpose: loan.purpose
          });
        }

        console.log(`📧 Notifications sent for loan approval: ${loan._id}`);
      } else {
        // Notify borrower about loan rejection
        await NotificationService.notifyLoanRejected({
          borrowerId: loan.borrower._id,
          borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
          loanId: loan._id,
          rejectionReason: rejectionReason
        });

        // Notify all lenders about loan rejection
        const lenders = await User.find({ userType: 'lender' });
        for (const lender of lenders) {
          await NotificationService.notifyLoanRejectedByAdmin({
            lenderId: lender._id,
            lenderName: `${lender.firstName} ${lender.lastName}`,
            loanId: loan._id,
            borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
            loanAmount: loan.loanAmount,
            rejectionReason: rejectionReason
          });
        }

        console.log(`📧 Notifications sent for loan rejection: ${loan._id}`);
      }

      // Clear collateral verification restrictions for rejected loans
      if (action === 'reject') {
        try {
          const Collateral = require('../models/Collateral');
          // Update any pending collateral verifications for this borrower to allow new submissions
          await Collateral.updateMany(
            {
              userId: loan.borrower._id,
              verificationStatus: { $in: ['pending', 'submitted', 'under_review'] }
            },
            {
              verificationStatus: 'rejected',
              rejectedAt: new Date(),
              rejectionReason: `Loan application rejected: ${rejectionReason}`
            }
          );
          console.log(`✅ Cleared collateral verification restrictions for borrower ${loan.borrower._id}`);
        } catch (collateralError) {
          console.error('Failed to clear collateral restrictions:', collateralError);
          // Don't fail the entire operation if collateral clearing fails
        }
      }
    } catch (notificationError) {
      console.error('Failed to send loan approval notifications:', notificationError);
      // Don't fail the entire operation if notifications fail
    }

    res.status(200).json({
      status: 'success',
      message: `Loan application ${action}d successfully by admin`,
      data: {
        loan: {
          id: updatedLoan._id,
          status: updatedLoan.status,
          reviewedAt: updatedLoan.reviewedAt,
          adminNotes: updatedLoan.adminNotes
        }
      }
    });

  } catch (error) {
    console.error('Admin loan approval error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process loan approval',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get loan application details for admin
// @route   GET /api/admin/loan/:id
// @access  Private (Admin only)
router.get('/loan/:id', protect, requireAdmin, async (req, res) => {
  try {
    console.log('Getting loan details for ID:', req.params.id);
    
    // Validate the loan ID format
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid loan ID format'
      });
    }

    let loan;
    try {
      console.log('Attempting to find loan with population...');
      loan = await Loan.findById(req.params.id)
        .populate('borrower', 'firstName lastName email phone kycStatus kycVerified kycData')
        .populate('fundingProgress.investors.user', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName email');
      
      console.log('Loan found with population. Borrower:', loan.borrower ? 'Found' : 'Not found');
      if (loan.borrower) {
        console.log('Borrower details:', {
          id: loan.borrower._id,
          firstName: loan.borrower.firstName,
          lastName: loan.borrower.lastName,
          email: loan.borrower.email
        });
      }
    } catch (populateError) {
      console.error('Population error:', populateError);
      console.log('Trying without population...');
      // Try without population if population fails
      loan = await Loan.findById(req.params.id);
      
      if (loan && loan.borrower) {
        console.log('Loan found without population. Borrower ID:', loan.borrower);
        // Manually populate borrower if needed
        try {
          const User = require('../models/User');
          const borrower = await User.findById(loan.borrower);
          if (borrower) {
            loan.borrower = borrower;
            console.log('Manually populated borrower:', borrower.firstName, borrower.lastName);
          }
        } catch (userError) {
          console.error('Error manually populating borrower:', userError);
        }
      }
    }

    if (!loan) {
      console.log('Loan not found for ID:', req.params.id);
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }

    console.log('Loan found:', loan._id, 'Status:', loan.status);

    // Ensure borrower data is properly populated
    let borrowerData = {
      id: 'unknown',
      name: 'Unknown User',
      email: 'N/A',
      phone: 'N/A',
      kycStatus: 'pending',
      kycVerified: false,
      kycData: null
    };

    if (loan.borrower) {
      if (typeof loan.borrower === 'object' && loan.borrower._id) {
        // Borrower is populated
        borrowerData = {
          id: loan.borrower._id,
          name: loan.borrower.firstName ? `${loan.borrower.firstName} ${loan.borrower.lastName}` : 'Unknown User',
          email: loan.borrower.email || 'N/A',
          phone: loan.borrower.phone || 'N/A',
          kycStatus: loan.borrower.kycStatus || 'pending',
          kycVerified: loan.borrower.kycVerified || false,
          kycData: loan.borrower.kycData || null
        };
        console.log('Using populated borrower data:', borrowerData.name);
      } else if (typeof loan.borrower === 'string') {
        // Borrower is just an ID, try to fetch manually
        console.log('Borrower is ID, fetching manually:', loan.borrower);
        try {
          const User = require('../models/User');
          const borrower = await User.findById(loan.borrower);
          if (borrower) {
            borrowerData = {
              id: borrower._id,
              name: borrower.firstName ? `${borrower.firstName} ${borrower.lastName}` : 'Unknown User',
              email: borrower.email || 'N/A',
              phone: borrower.phone || 'N/A',
              kycStatus: borrower.kycStatus || 'pending',
              kycVerified: borrower.kycVerified || false,
              kycData: borrower.kycData || null
            };
            console.log('Manually fetched borrower data:', borrowerData.name);
          }
        } catch (userError) {
          console.error('Error fetching borrower manually:', userError);
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        loan: {
          id: loan._id,
          loanAmount: loan.loanAmount,
          purpose: loan.purpose,
          purposeDescription: loan.purposeDescription,
          duration: loan.duration,
          interestRate: loan.interestRate,
          monthlyPayment: loan.monthlyPayment,
          totalRepayment: loan.totalRepayment,
          totalInterest: loan.totalInterest,
          collateral: loan.collateral,
          status: loan.status,
          kycStatus: loan.kycStatus,
          createdAt: loan.createdAt,
          submittedAt: loan.submittedAt,
          reviewedAt: loan.reviewedAt,
          rejectionReason: loan.rejectionReason,
          adminNotes: loan.adminNotes,
          borrower: borrowerData,
          fundingProgress: {
            fundedAmount: loan.fundingProgress?.fundedAmount || 0,
            targetAmount: loan.fundingProgress?.targetAmount || loan.loanAmount,
            investors: loan.fundingProgress?.investors || [],
            fundingPercentage: loan.fundingProgress?.fundedAmount && loan.fundingProgress?.targetAmount ? 
              Math.round((loan.fundingProgress.fundedAmount / loan.fundingProgress.targetAmount) * 100) : 0
          },
          reviewedBy: loan.reviewedBy ? {
            name: loan.reviewedBy.firstName ? `${loan.reviewedBy.firstName} ${loan.reviewedBy.lastName}` : 'Unknown Reviewer',
            email: loan.reviewedBy.email || 'N/A'
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Get admin loan details error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get loan details',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== WALLET ENDPOINTS ====================

// @desc    Create wallet for admin
// @route   POST /api/admin/wallet/create
// @access  Private (Admin only)
router.post('/wallet/create', protect, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ user: userId });
    if (existingWallet) {
      return res.status(400).json({
        status: 'error',
        message: 'Wallet already exists for this admin'
      });
    }

    // Create new wallet with default admin balance
    const wallet = await Wallet.create({
      user: userId,
      balance: 0, // Default admin balance
      currency: 'USD'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin wallet created successfully',
      data: {
        wallet: {
          id: wallet._id,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating admin wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create admin wallet'
    });
  }
});

// @desc    Get admin wallet balance
// @route   GET /api/admin/wallet/balance
// @access  Private (Admin only)
router.get('/wallet/balance', protect, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await Wallet.findOne({ user: userId })
      .populate('user', 'firstName lastName email userType');

    if (!wallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin wallet not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        limits: wallet.limits,
        stats: wallet.stats
      }
    });

  } catch (error) {
    console.error('Error fetching admin wallet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin wallet details'
    });
  }
});

// @desc    Get notifications for admin
// @route   GET /api/admin/notifications
// @access  Private (Admin only)
router.get('/notifications', protect, requireAdmin, async (req, res) => {
  try {
    // Get notifications for this admin
    const notifications = await Notification.find({
      recipient: req.user.id
    })
    .populate('recipient', 'firstName lastName email userType')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 notifications

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        total: notifications.length,
        unread: notifications.filter(n => !n.readAt).length
      }
    });

  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin notifications',
      error: error.message
    });
  }
});

module.exports = router; 