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
  documents: [{
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationId: {
    type: String,
    sparse: true
  },
  onfidoResult: {
    status: {
      type: String,
      enum: ['clear', 'suspected', 'rejected', 'needs_review'],
      default: null
    },
    reportId: String,
    completedAt: Date,
    notes: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  adminNotes: String,
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
collateralSchema.methods.updateVerificationStatus = function(status, onfidoData = {}) {
  this.verificationStatus = status;
  
  if (status === 'verified') {
    this.verifiedAt = new Date();
    this.onfidoResult = onfidoData;
  } else if (status === 'rejected') {
    this.rejectedAt = new Date();
    this.onfidoResult = onfidoData;
  } else if (status === 'submitted') {
    this.submittedAt = new Date();
  }
  
  return this.save();
};

// Static method to get verified collateral for a user
collateralSchema.statics.getVerifiedCollateral = function(userId) {
  return this.find({
    userId,
    verificationStatus: 'verified',
    isActive: true
  }).sort({ verifiedAt: -1 });
};

// Static method to get pending verifications
collateralSchema.statics.getPendingVerifications = function() {
  return this.find({
    verificationStatus: 'submitted',
    isActive: true
  }).populate('userId', 'firstName lastName email phone').sort({ submittedAt: 1 });
};

// Pre-save middleware to validate document count
collateralSchema.pre('save', function(next) {
  if (this.documents.length === 0) {
    return next(new Error('At least one document is required'));
  }
  next();
});

module.exports = mongoose.model('Collateral', collateralSchema);
