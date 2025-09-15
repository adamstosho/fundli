const Collateral = require('../models/Collateral');
const User = require('../models/User');
const Loan = require('../models/Loan');
const NotificationService = require('../services/notificationService');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload base64 file to Cloudinary
const uploadBase64ToCloudinary = async (base64String, originalName) => {
  try {
    console.log('Attempting Cloudinary upload for:', originalName);
    console.log('Base64 length:', base64String.length);
    
    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'fundli/collateral',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      max_bytes: 10 * 1024 * 1024, // 10MB limit
    });
    
    console.log('Cloudinary upload successful:', result.public_id);
    return result;
  } catch (error) {
    console.error('Cloudinary upload failed for', originalName, ':', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// @desc    Create collateral verification submission
// @route   POST /api/collateral/submit
// @access  Private (Borrowers only)
const submitCollateralVerification = async (req, res) => {
  try {
    console.log('Collateral submission request received');
    console.log('User from middleware:', req.user);
    console.log('Request body keys:', Object.keys(req.body));
    
    const userId = req.user.id;
    const { 
      collateralType, 
      description, 
      estimatedValue, 
      bvn, 
      documentTypes,
      collateralDocuments,
      bankStatement
    } = req.body;

    // Validate required fields
    if (!collateralType || !description || !estimatedValue || !bvn) {
      return res.status(400).json({
        status: 'error',
        message: 'All required fields must be provided'
      });
    }

    // Validate BVN format
    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN must be exactly 11 digits'
      });
    }

    // Check if user already has a pending submission
    const existingCollateral = await Collateral.findOne({
      userId,
      verificationStatus: { $in: ['pending', 'submitted', 'under_review'] }
    });

    if (existingCollateral) {
      // Check if the user has any rejected loans - if so, allow new collateral submission
      const Loan = require('../models/Loan');
      const hasRejectedLoan = await Loan.findOne({
        borrower: userId,
        status: 'rejected',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Within last 7 days
      });

      if (!hasRejectedLoan) {
        return res.status(400).json({
          status: 'error',
          message: 'You already have a collateral verification submission pending review. Please wait for it to be approved before submitting another one.'
        });
      } else {
        console.log(`✅ User ${userId} has a rejected loan, allowing new collateral submission`);
        // Update the existing collateral to allow new submission
        existingCollateral.verificationStatus = 'rejected';
        existingCollateral.rejectedAt = new Date();
        await existingCollateral.save();
      }
    }

    // Process uploaded files with Cloudinary
    const processedCollateralDocuments = [];
    const processedBankStatement = {};

    console.log('Processing collateral documents...');
    console.log('Collateral documents received:', collateralDocuments?.length || 0);
    
    // Process collateral documents
    if (collateralDocuments && Array.isArray(collateralDocuments)) {
      for (let i = 0; i < collateralDocuments.length; i++) {
        const file = collateralDocuments[i];
        console.log(`Processing document ${i + 1}:`, file.name, 'Base64 present:', !!file.base64);
        
        if (file.base64) {
          try {
            const cloudinaryResult = await uploadBase64ToCloudinary(file.base64, file.name);
            
            processedCollateralDocuments.push({
              fileName: cloudinaryResult.public_id,
              originalName: file.name,
              fileUrl: cloudinaryResult.secure_url,
              fileSize: cloudinaryResult.bytes,
              mimeType: cloudinaryResult.format,
              documentType: documentTypes[i] || 'other',
              uploadDate: new Date()
            });
            
            console.log('Document processed successfully:', file.name);
          } catch (error) {
            console.error('Failed to process document:', file.name, error.message);
            throw error;
          }
        } else {
          console.log('No base64 data for document:', file.name);
        }
      }
    } else {
      console.log('No collateral documents provided');
    }

    console.log('Processing bank statement...');
    console.log('Bank statement received:', !!bankStatement);
    
    // Process bank statement
    if (bankStatement && bankStatement.base64) {
      console.log('Bank statement name:', bankStatement.name, 'Base64 present:', !!bankStatement.base64);
      
      try {
        const cloudinaryResult = await uploadBase64ToCloudinary(bankStatement.base64, bankStatement.name);
        
        processedBankStatement.fileName = cloudinaryResult.public_id;
        processedBankStatement.originalName = bankStatement.name;
        processedBankStatement.fileUrl = cloudinaryResult.secure_url;
        processedBankStatement.fileSize = cloudinaryResult.bytes;
        processedBankStatement.mimeType = cloudinaryResult.format;
        processedBankStatement.uploadDate = new Date();
        
        console.log('Bank statement processed successfully:', bankStatement.name);
      } catch (error) {
        console.error('Failed to process bank statement:', bankStatement.name, error.message);
        throw error;
      }
    } else {
      console.log('No bank statement provided');
    }

    console.log('Final processed documents:', processedCollateralDocuments.length);
    console.log('Final bank statement:', Object.keys(processedBankStatement).length > 0);

    // Create collateral verification record
    const collateral = new Collateral({
      userId,
      collateralType,
      description,
      estimatedValue: parseFloat(estimatedValue),
      collateralDocuments: processedCollateralDocuments,
      bankStatement: processedBankStatement,
      bvn,
      verificationStatus: 'submitted',
      submittedAt: new Date()
    });

    console.log('Saving collateral to database...');
    console.log('Collateral documents to save:', processedCollateralDocuments.length);
    console.log('Bank statement to save:', Object.keys(processedBankStatement).length > 0);
    
    await collateral.save();
    console.log('Collateral saved successfully with ID:', collateral._id);

    // Create notification for collateral submission
    try {
      await NotificationService.notifyCollateralVerification({
        borrowerId: userId,
        borrowerName: `${req.user.firstName} ${req.user.lastName}`,
        collateralType: collateralType,
        estimatedValue: parseFloat(estimatedValue)
      });
      console.log('📧 Notification sent for collateral verification submission');
    } catch (notificationError) {
      console.error('Failed to send collateral verification notification:', notificationError);
      // Don't fail the entire transaction if notification fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Collateral verification submitted successfully',
      data: {
        collateral: {
          id: collateral._id,
          collateralType: collateral.collateralType,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt
        }
      }
    });

  } catch (error) {
    console.error('Collateral submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit collateral verification',
      error: error.message
    });
  }
};

// @desc    Get user's collateral verification status
// @route   GET /api/collateral/status
// @access  Private (Borrowers only)
const getCollateralStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const collateral = await Collateral.findOne({ userId })
      .populate('adminReview.reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (!collateral) {
      return res.status(404).json({
        status: 'error',
        message: 'No collateral verification found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        collateral: {
          id: collateral._id,
          collateralType: collateral.collateralType,
          description: collateral.description,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt,
          approvedAt: collateral.approvedAt,
          rejectedAt: collateral.rejectedAt,
          adminReview: collateral.adminReview ? {
            reviewedBy: collateral.adminReview.reviewedBy,
            reviewedAt: collateral.adminReview.reviewedAt,
            status: collateral.adminReview.status,
            notes: collateral.adminReview.notes,
            rejectionReason: collateral.adminReview.rejectionReason,
            verifiedValue: collateral.adminReview.verifiedValue,
            verificationNotes: collateral.adminReview.verificationNotes
          } : null,
          collateralDocuments: collateral.collateralDocuments.map(doc => ({
            fileName: doc.fileName,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
          })),
          bankStatement: collateral.bankStatement ? {
            fileName: collateral.bankStatement.fileName,
            originalName: collateral.bankStatement.originalName,
            fileUrl: collateral.bankStatement.fileUrl,
            fileSize: collateral.bankStatement.fileSize,
            mimeType: collateral.bankStatement.mimeType,
            uploadDate: collateral.bankStatement.uploadDate
          } : null,
          bvn: collateral.bvn ? '***' + collateral.bvn.slice(-4) : null // Mask BVN for security
        }
      }
    });

  } catch (error) {
    console.error('Get collateral status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get collateral status',
      error: error.message
    });
  }
};

// @desc    Get all pending collateral verifications (Admin only)
// @route   GET /api/admin/collateral/pending
// @access  Private (Admin only)
const getPendingVerifications = async (req, res) => {
  try {
    console.log('Getting pending verifications...');
    
    const pendingVerifications = await Collateral.find({
      verificationStatus: { $in: ['submitted', 'under_review'] },
      isActive: true
    })
      .populate('userId', 'firstName lastName email phone')
      .sort({ submittedAt: 1 });

    console.log(`Found ${pendingVerifications.length} pending verifications`);

    res.status(200).json({
      status: 'success',
      data: {
        verifications: pendingVerifications.map(collateral => ({
          id: collateral._id,
          user: {
            id: collateral.userId._id,
            name: `${collateral.userId.firstName} ${collateral.userId.lastName}`,
            email: collateral.userId.email,
            phone: collateral.userId.phone
          },
          collateralType: collateral.collateralType,
          description: collateral.description,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt,
          collateralDocuments: collateral.collateralDocuments.map(doc => ({
            fileName: doc.fileName,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
          })),
          bankStatement: collateral.bankStatement ? {
            fileName: collateral.bankStatement.fileName,
            originalName: collateral.bankStatement.originalName,
            fileUrl: collateral.bankStatement.fileUrl,
            fileSize: collateral.bankStatement.fileSize,
            mimeType: collateral.bankStatement.mimeType,
            uploadDate: collateral.bankStatement.uploadDate
          } : null,
          bvn: collateral.bvn
        }))
      }
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get pending verifications',
      error: error.message
    });
  }
};

// @desc    Review collateral verification (Admin only)
// @route   POST /api/admin/collateral/:id/review
// @access  Private (Admin only)
const reviewCollateralVerification = async (req, res) => {
  try {
    const { status, notes, rejectionReason, verifiedValue, verificationNotes } = req.body;
    const collateralId = req.params.id;
    const adminId = req.user.id;

    if (!['approved', 'rejected', 'needs_more_info'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid review status'
      });
    }

    const collateral = await Collateral.findById(collateralId);
    if (!collateral) {
      return res.status(404).json({
        status: 'error',
        message: 'Collateral verification not found'
      });
    }

    if (collateral.verificationStatus === 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'This collateral verification has already been approved'
      });
    }

    // Update verification status
    const newStatus = status === 'needs_more_info' ? 'under_review' : status;
    await collateral.updateVerificationStatus(newStatus, {
      reviewedBy: adminId,
      notes,
      rejectionReason,
      verifiedValue: status === 'approved' ? parseFloat(verifiedValue) : null,
      verificationNotes: verificationNotes || notes
    });

    console.log(`Collateral verification ${collateralId} ${newStatus} by admin ${adminId}`);

    // Create notification for collateral decision
    try {
      await NotificationService.notifyCollateralDecision({
        borrowerId: collateral.userId,
        status: newStatus,
        collateralType: collateral.collateralType,
        estimatedValue: collateral.estimatedValue,
        verifiedValue: status === 'approved' ? parseFloat(verifiedValue) : null,
        rejectionReason: rejectionReason
      });
      console.log(`📧 Notification sent for collateral ${newStatus} decision`);
    } catch (notificationError) {
      console.error('Failed to send collateral decision notification:', notificationError);
      // Don't fail the entire transaction if notification fails
    }

    // If rejected, schedule automatic deletion after 24 hours
    if (status === 'rejected') {
      console.log(`Collateral verification ${collateral._id} rejected. Will be deleted in 24 hours.`);
      
      // Schedule deletion after 24 hours (86400000 ms)
      setTimeout(async () => {
        try {
          await Collateral.findByIdAndDelete(collateral._id);
          console.log(`Collateral verification ${collateral._id} automatically deleted after rejection.`);
        } catch (error) {
          console.error('Error auto-deleting rejected collateral:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
    }

    res.status(200).json({
      status: 'success',
      message: `Collateral verification ${status} successfully`,
      data: {
        collateral: {
          id: collateral._id,
          verificationStatus: collateral.verificationStatus,
          adminReview: collateral.adminReview
        }
      }
    });

  } catch (error) {
    console.error('Review collateral verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to review collateral verification',
      error: error.message
    });
  }
};

// @desc    Get collateral verification details (Admin only)
// @route   GET /api/admin/collateral/:id
// @access  Private (Admin only)
const getCollateralDetails = async (req, res) => {
  try {
    const collateralId = req.params.id;

    const collateral = await Collateral.findById(collateralId)
      .populate('userId', 'firstName lastName email phone')
      .populate('adminReview.reviewedBy', 'firstName lastName email');

    if (!collateral) {
      return res.status(404).json({
        status: 'error',
        message: 'Collateral verification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        collateral: {
          id: collateral._id,
          user: {
            id: collateral.userId._id,
            name: `${collateral.userId.firstName} ${collateral.userId.lastName}`,
            email: collateral.userId.email,
            phone: collateral.userId.phone
          },
          collateralType: collateral.collateralType,
          description: collateral.description,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt,
          approvedAt: collateral.approvedAt,
          rejectedAt: collateral.rejectedAt,
          adminReview: collateral.adminReview ? {
            reviewedBy: collateral.adminReview.reviewedBy,
            reviewedAt: collateral.adminReview.reviewedAt,
            status: collateral.adminReview.status,
            notes: collateral.adminReview.notes,
            rejectionReason: collateral.adminReview.rejectionReason,
            verifiedValue: collateral.adminReview.verifiedValue,
            verificationNotes: collateral.adminReview.verificationNotes
          } : null,
          collateralDocuments: collateral.collateralDocuments.map(doc => ({
            fileName: doc.fileName,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
          })),
          bankStatement: collateral.bankStatement ? {
            fileName: collateral.bankStatement.fileName,
            originalName: collateral.bankStatement.originalName,
            fileUrl: collateral.bankStatement.fileUrl,
            fileSize: collateral.bankStatement.fileSize,
            mimeType: collateral.bankStatement.mimeType,
            uploadDate: collateral.bankStatement.uploadDate
          } : null,
          bvn: collateral.bvn
        }
      }
    });

  } catch (error) {
    console.error('Get collateral details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get collateral details',
      error: error.message
    });
  }
};

// @desc    Get all rejected collateral verifications (Admin only)
// @route   GET /api/collateral/admin/rejected
// @access  Private (Admin only)
const getRejectedVerifications = async (req, res) => {
  try {
    const rejectedVerifications = await Collateral.find({ verificationStatus: 'rejected' })
      .populate('userId', 'firstName lastName email phone')
      .populate('adminReview.reviewedBy', 'firstName lastName email')
      .sort({ rejectedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        verifications: rejectedVerifications.map(collateral => ({
          id: collateral._id,
          user: {
            id: collateral.userId._id,
            name: `${collateral.userId.firstName} ${collateral.userId.lastName}`,
            email: collateral.userId.email,
            phone: collateral.userId.phone
          },
          collateralType: collateral.collateralType,
          description: collateral.description,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt,
          rejectedAt: collateral.rejectedAt,
          adminReview: collateral.adminReview ? {
            reviewedBy: collateral.adminReview.reviewedBy,
            reviewedAt: collateral.adminReview.reviewedAt,
            status: collateral.adminReview.status,
            notes: collateral.adminReview.notes,
            rejectionReason: collateral.adminReview.rejectionReason,
            verifiedValue: collateral.adminReview.verifiedValue,
            verificationNotes: collateral.adminReview.verificationNotes
          } : null,
          collateralDocuments: collateral.collateralDocuments.map(doc => ({
            fileName: doc.fileName,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
          })),
          bankStatement: collateral.bankStatement ? {
            fileName: collateral.bankStatement.fileName,
            originalName: collateral.bankStatement.originalName,
            fileUrl: collateral.bankStatement.fileUrl,
            fileSize: collateral.bankStatement.fileSize,
            mimeType: collateral.bankStatement.mimeType,
            uploadDate: collateral.bankStatement.uploadDate
          } : null,
          bvn: collateral.bvn
        }))
      }
    });

  } catch (error) {
    console.error('Get rejected verifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get rejected verifications',
      error: error.message
    });
  }
};

// @desc    Get all approved collateral verifications (Admin only)
// @route   GET /api/collateral/admin/approved
// @access  Private (Admin only)
const getApprovedVerifications = async (req, res) => {
  try {
    console.log('Getting approved verifications...');
    
    // First check if there are any collateral records at all
    const totalCollateral = await Collateral.countDocuments();
    console.log(`Total collateral records in database: ${totalCollateral}`);
    
    if (totalCollateral === 0) {
      console.log('No collateral records found in database');
      return res.status(200).json({
        status: 'success',
        data: {
          verifications: []
        }
      });
    }
    
    const approvedVerifications = await Collateral.find({ verificationStatus: 'approved' })
      .populate('userId', 'firstName lastName email phone')
      .populate('adminReview.reviewedBy', 'firstName lastName email')
      .sort({ approvedAt: -1 });

    console.log(`Found ${approvedVerifications.length} approved verifications`);

    res.status(200).json({
      status: 'success',
      data: {
        verifications: approvedVerifications.map(collateral => ({
          id: collateral._id,
          user: {
            id: collateral.userId._id,
            name: `${collateral.userId.firstName} ${collateral.userId.lastName}`,
            email: collateral.userId.email,
            phone: collateral.userId.phone
          },
          collateralType: collateral.collateralType,
          description: collateral.description,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt,
          approvedAt: collateral.approvedAt,
          adminReview: collateral.adminReview ? {
            reviewedBy: collateral.adminReview.reviewedBy,
            reviewedAt: collateral.adminReview.reviewedAt,
            status: collateral.adminReview.status,
            notes: collateral.adminReview.notes,
            rejectionReason: collateral.adminReview.rejectionReason,
            verifiedValue: collateral.adminReview.verifiedValue,
            verificationNotes: collateral.adminReview.verificationNotes
          } : null,
          collateralDocuments: collateral.collateralDocuments.map(doc => ({
            fileName: doc.fileName,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
          })),
          bankStatement: collateral.bankStatement ? {
            fileName: collateral.bankStatement.fileName,
            originalName: collateral.bankStatement.originalName,
            fileUrl: collateral.bankStatement.fileUrl,
            fileSize: collateral.bankStatement.fileSize,
            mimeType: collateral.bankStatement.mimeType,
            uploadDate: collateral.bankStatement.uploadDate
          } : null,
          bvn: collateral.bvn
        }))
      }
    });

  } catch (error) {
    console.error('Get approved verifications error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get approved verifications',
      error: error.message
    });
  }
};

// @desc    Delete collateral verification (Admin only)
// @route   DELETE /api/collateral/admin/:id/delete
// @access  Private (Admin only)
const deleteCollateralVerification = async (req, res) => {
  try {
    const collateralId = req.params.id;
    const adminId = req.user.id;

    const collateral = await Collateral.findById(collateralId);
    if (!collateral) {
      return res.status(404).json({
        status: 'error',
        message: 'Collateral verification not found'
      });
    }

    // Log the deletion for audit purposes
    console.log(`Admin ${adminId} deleting collateral verification ${collateralId} for user ${collateral.userId}`);

    // Mark as deleted instead of actually deleting
    collateral.verificationStatus = 'deleted';
    collateral.deletedAt = new Date();
    collateral.deletedBy = adminId;
    await collateral.save();

    console.log(`Collateral ${collateralId} marked as deleted by admin ${adminId}`);

    res.status(200).json({
      status: 'success',
      message: 'Collateral verification deleted successfully'
    });

  } catch (error) {
    console.error('Delete collateral verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete collateral verification',
      error: error.message
    });
  }
};

// @desc    Get all deleted collateral verifications (Admin only)
// @route   GET /api/collateral/admin/deleted
// @access  Private (Admin only)
const getDeletedVerifications = async (req, res) => {
  try {
    console.log('Getting deleted verifications...');
    
    // First check if there are any collateral records at all
    const totalCollateral = await Collateral.countDocuments();
    console.log(`Total collateral records in database: ${totalCollateral}`);
    
    if (totalCollateral === 0) {
      console.log('No collateral records found in database');
      return res.status(200).json({
        status: 'success',
        data: {
          verifications: []
        }
      });
    }
    
    const deletedVerifications = await Collateral.find({ verificationStatus: 'deleted' })
      .populate('userId', 'firstName lastName email phone')
      .populate('adminReview.reviewedBy', 'firstName lastName email')
      .populate('deletedBy', 'firstName lastName email')
      .sort({ deletedAt: -1 });

    console.log(`Found ${deletedVerifications.length} deleted verifications`);

    res.status(200).json({
      status: 'success',
      data: {
        verifications: deletedVerifications.map(collateral => ({
          id: collateral._id,
          user: {
            id: collateral.userId._id,
            name: `${collateral.userId.firstName} ${collateral.userId.lastName}`,
            email: collateral.userId.email,
            phone: collateral.userId.phone
          },
          collateralType: collateral.collateralType,
          description: collateral.description,
          estimatedValue: collateral.estimatedValue,
          verificationStatus: collateral.verificationStatus,
          submittedAt: collateral.submittedAt,
          deletedAt: collateral.deletedAt,
          deletedBy: collateral.deletedBy ? {
            id: collateral.deletedBy._id,
            name: `${collateral.deletedBy.firstName} ${collateral.deletedBy.lastName}`,
            email: collateral.deletedBy.email
          } : null,
          adminReview: collateral.adminReview ? {
            reviewedBy: collateral.adminReview.reviewedBy,
            reviewedAt: collateral.adminReview.reviewedAt,
            status: collateral.adminReview.status,
            notes: collateral.adminReview.notes,
            rejectionReason: collateral.adminReview.rejectionReason,
            verifiedValue: collateral.adminReview.verifiedValue,
            verificationNotes: collateral.adminReview.verificationNotes
          } : null,
          collateralDocuments: collateral.collateralDocuments.map(doc => ({
            fileName: doc.fileName,
            originalName: doc.originalName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
            uploadDate: doc.uploadDate
          })),
          bankStatement: collateral.bankStatement ? {
            fileName: collateral.bankStatement.fileName,
            originalName: collateral.bankStatement.originalName,
            fileUrl: collateral.bankStatement.fileUrl,
            fileSize: collateral.bankStatement.fileSize,
            mimeType: collateral.bankStatement.mimeType,
            uploadDate: collateral.bankStatement.uploadDate
          } : null,
          bvn: collateral.bvn
        }))
      }
    });

  } catch (error) {
    console.error('Get deleted verifications error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get deleted verifications',
      error: error.message
    });
  }
};

module.exports = {
  submitCollateralVerification,
  getCollateralStatus,
  getPendingVerifications,
  reviewCollateralVerification,
  getCollateralDetails,
  getRejectedVerifications,
  getApprovedVerifications,
  deleteCollateralVerification,
  getDeletedVerifications
};
