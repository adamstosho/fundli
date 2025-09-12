const mongoose = require('mongoose');

const collateralSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collateralType: {
    type: String,
    enum: ['real_estate', 'vehicle', 'business', 'investment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedValue: {
    type: Number,
    required: true,
    min: 0
  },
  // Collateral ownership proof documents
  collateralDocuments: [{
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    documentType: {
      type: String,
      enum: ['title_deed', 'registration_paper', 'purchase_receipt', 'ownership_certificate', 'other'],
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Bank statement and BVN information
  bankStatement: {
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  bvn: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{11}$/.test(v);
      },
      message: 'BVN must be exactly 11 digits'
    }
  },
  // Manual verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'submitted', 'under_review', 'approved', 'rejected', 'deleted'],
    default: 'pending'
  },
  // Admin review information
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    status: {
      type: String,
      enum: ['approved', 'rejected', 'needs_more_info']
    },
    notes: String,
    rejectionReason: String,
    verifiedValue: {
      type: Number,
      default: null
    },
    verificationNotes: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date,
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
collateralSchema.index({ userId: 1, verificationStatus: 1 });
collateralSchema.index({ verificationStatus: 1, submittedAt: 1 });
collateralSchema.index({ collateralType: 1, verificationStatus: 1 });

// Virtual for total collateral value
collateralSchema.virtual('totalValue').get(function() {
  return this.estimatedValue;
});

// Method to update verification status
collateralSchema.methods.updateVerificationStatus = function(status, adminData = {}) {
  this.verificationStatus = status;
  
  if (status === 'approved') {
    this.approvedAt = new Date();
    this.adminReview = {
      ...this.adminReview,
      reviewedBy: adminData.reviewedBy,
      reviewedAt: new Date(),
      status: 'approved',
      notes: adminData.notes,
      verifiedValue: adminData.verifiedValue,
      verificationNotes: adminData.verificationNotes
    };
  } else if (status === 'rejected') {
    this.rejectedAt = new Date();
    this.adminReview = {
      ...this.adminReview,
      reviewedBy: adminData.reviewedBy,
      reviewedAt: new Date(),
      status: 'rejected',
      notes: adminData.notes,
      rejectionReason: adminData.rejectionReason,
      verificationNotes: adminData.verificationNotes
    };
  } else if (status === 'submitted') {
    this.submittedAt = new Date();
  } else if (status === 'under_review') {
    this.adminReview = {
      ...this.adminReview,
      reviewedBy: adminData.reviewedBy,
      reviewedAt: new Date(),
      status: 'needs_more_info',
      notes: adminData.notes,
      verificationNotes: adminData.verificationNotes
    };
  }
  
  return this.save();
};

// Static method to get approved collateral for a user
collateralSchema.statics.getApprovedCollateral = function(userId) {
  return this.find({
    userId,
    verificationStatus: 'approved',
    isActive: true
  }).sort({ approvedAt: -1 });
};

// Static method to get pending verifications for admin review
collateralSchema.statics.getPendingVerifications = function() {
  return this.find({
    verificationStatus: { $in: ['submitted', 'under_review'] },
    isActive: true
  }).populate('userId', 'firstName lastName email phone').sort({ submittedAt: 1 });
};

// Pre-save middleware to validate required documents (only for new documents)
collateralSchema.pre('save', function(next) {
  // Only validate for new documents, not updates
  if (this.isNew) {
    if (this.collateralDocuments.length === 0) {
      return next(new Error('At least one collateral document is required'));
    }
    if (!this.bankStatement.fileUrl) {
      return next(new Error('Bank statement is required'));
    }
    if (!this.bvn) {
      return next(new Error('BVN is required'));
    }
  }
  next();
});

module.exports = mongoose.model('Collateral', collateralSchema);
