const Collateral = require('../models/Collateral');
const User = require('../models/User');
const cloudinaryService = require('../services/cloudinaryService');
const { verifyDocumentWithOnfido } = require('../services/onfidoService');

// Get all collateral for a user
const getUserCollateral = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let query = { userId, isActive: true };
    if (status) {
      query.verificationStatus = status;
    }

    const collateral = await Collateral.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: collateral
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collateral',
      error: error.message
    });
  }
};

// Get verified collateral for a user (for lenders)
const getVerifiedCollateral = async (req, res) => {
  try {
    const { userId } = req.params;

    const collateral = await Collateral.getVerifiedCollateral(userId);

    res.json({
      success: true,
      data: collateral
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verified collateral',
      error: error.message
    });
  }
};

// Submit collateral for verification
const submitForVerification = async (req, res) => {
  try {
    const { collateralType, description, estimatedValue } = req.body;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one document is required'
      });
    }

    // Upload files to Cloudinary
    const uploadedDocuments = [];
    for (const file of req.files) {
      try {
        const result = await cloudinaryService.uploadFile(file.path, 'collateral-documents');
        uploadedDocuments.push({
          fileName: result.publicId,
          originalName: file.originalname,
          fileUrl: result.url,
          fileSize: file.size,
          mimeType: file.mimetype
        });
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload document'
        });
      }
    }

    // Create collateral record
    const collateral = new Collateral({
      userId,
      collateralType,
      description,
      estimatedValue: parseFloat(estimatedValue),
      documents: uploadedDocuments,
      verificationStatus: 'submitted',
      submittedAt: new Date()
    });

    await collateral.save();

    // Submit to Onfido for verification (async)
    try {
      const onfidoResult = await verifyDocumentWithOnfido(uploadedDocuments, collateral._id);
      
      if (onfidoResult.success) {
        collateral.verificationId = onfidoResult.verificationId;
        await collateral.save();
      }
    } catch (onfidoError) {
      console.error('Onfido verification error:', onfidoError);
      // Don't fail the request if Onfido fails
    }

    res.status(201).json({
      success: true,
      message: 'Collateral submitted for verification',
      data: {
        collateralId: collateral._id,
        verificationId: collateral.verificationId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit collateral for verification',
      error: error.message
    });
  }
};

// Update collateral verification status (admin only)
const updateVerificationStatus = async (req, res) => {
  try {
    const { collateralId } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;

    const collateral = await Collateral.findById(collateralId);
    if (!collateral) {
      return res.status(404).json({
        success: false,
        message: 'Collateral not found'
      });
    }

    // Update status
    await collateral.updateVerificationStatus(status, {
      status: status === 'verified' ? 'clear' : 'rejected',
      notes: adminNotes || rejectionReason
    });

    // Update additional fields
    if (status === 'rejected' && rejectionReason) {
      collateral.rejectionReason = rejectionReason;
    }
    if (adminNotes) {
      collateral.adminNotes = adminNotes;
    }

    await collateral.save();

    res.json({
      success: true,
      message: 'Collateral verification status updated',
      data: collateral
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status',
      error: error.message
    });
  }
};

// Get pending verifications (admin only)
const getPendingVerifications = async (req, res) => {
  try {
    const pendingVerifications = await Collateral.getPendingVerifications();

    res.json({
      success: true,
      data: pendingVerifications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications',
      error: error.message
    });
  }
};

// Get collateral statistics (admin only)
const getCollateralStats = async (req, res) => {
  try {
    const stats = await Collateral.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' }
        }
      }
    ]);

    const totalCollateral = await Collateral.countDocuments({ isActive: true });
    const totalValue = await Collateral.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]);

    res.json({
      success: true,
      data: {
        stats,
        totalCollateral,
        totalValue: totalValue[0]?.total || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collateral statistics',
      error: error.message
    });
  }
};

// Delete collateral (user can only delete pending collateral)
const deleteCollateral = async (req, res) => {
  try {
    const { collateralId } = req.params;
    const userId = req.user.id;

    const collateral = await Collateral.findById(collateralId);
    if (!collateral) {
      return res.status(404).json({
        success: false,
        message: 'Collateral not found'
      });
    }

    // Check ownership
    if (collateral.userId.toString() !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this collateral'
      });
    }

    // Only allow deletion of pending collateral
    if (collateral.verificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending collateral'
      });
    }

    await Collateral.findByIdAndDelete(collateralId);

    res.json({
      success: true,
      message: 'Collateral deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete collateral',
      error: error.message
    });
  }
};

// Webhook for Onfido verification results
const onfidoWebhook = async (req, res) => {
  try {
    const { payload } = req.body;
    
    if (payload.type === 'check.completed') {
      const { check_id, status } = payload.data;
      
      // Find collateral by verification ID
      const collateral = await Collateral.findOne({ verificationId: check_id });
      if (!collateral) {
        return res.status(404).json({
          success: false,
          message: 'Collateral not found'
        });
      }

      // Update verification status based on Onfido result
      let newStatus = 'pending';
      if (status === 'clear') {
        newStatus = 'verified';
      } else if (status === 'rejected') {
        newStatus = 'rejected';
      } else if (status === 'suspected') {
        newStatus = 'rejected';
      }

      await collateral.updateVerificationStatus(newStatus, {
        status,
        reportId: check_id,
        completedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'Webhook received but not processed'
      });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

module.exports = {
  getUserCollateral,
  getVerifiedCollateral,
  submitForVerification,
  updateVerificationStatus,
  getPendingVerifications,
  getCollateralStats,
  deleteCollateral,
  onfidoWebhook
};
