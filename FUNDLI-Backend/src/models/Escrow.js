const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
  // Loan reference
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true,
    unique: true
  },
  
  // Parties involved
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Escrow amount
  amount: {
    type: Number,
    required: true,
    min: [0, 'Escrow amount cannot be negative']
  },
  
  // Escrow status
  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Release conditions
  releaseConditions: {
    loanApproved: {
      type: Boolean,
      default: false
    },
    kycVerified: {
      type: Boolean,
      default: false
    },
    collateralVerified: {
      type: Boolean,
      default: false
    },
    allConditionsMet: {
      type: Boolean,
      default: false
    }
  },
  
  // Payment details
  paymentDetails: {
    paystackReference: String,
    paystackTransactionId: String,
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet'],
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  
  // Release information
  releasedAt: Date,
  releaseReason: String,
  releasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Refund information
  refundedAt: Date,
  refundReason: String,
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Escrow fees
  escrowFee: {
    type: Number,
    default: 0
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for escrow duration
escrowSchema.virtual('durationInDays').get(function() {
  if (this.releasedAt || this.refundedAt) {
    const endDate = this.releasedAt || this.refundedAt;
    const diffTime = endDate - this.createdAt;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const now = new Date();
  const diffTime = now - this.createdAt;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is ready to release
escrowSchema.virtual('isReadyToRelease').get(function() {
  return this.releaseConditions.loanApproved && 
         this.releaseConditions.kycVerified && 
         this.releaseConditions.collateralVerified;
});

// Indexes
escrowSchema.index({ lenderId: 1 });
escrowSchema.index({ borrowerId: 1 });
escrowSchema.index({ status: 1 });
escrowSchema.index({ createdAt: -1 });
escrowSchema.index({ 'paymentDetails.paystackReference': 1 });

// Pre-save middleware
escrowSchema.pre('save', function(next) {
  // Update allConditionsMet based on individual conditions
  this.releaseConditions.allConditionsMet = 
    this.releaseConditions.loanApproved && 
    this.releaseConditions.kycVerified && 
    this.releaseConditions.collateralVerified;
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Instance methods
escrowSchema.methods.checkReleaseConditions = function() {
  const conditions = this.releaseConditions;
  const missingConditions = [];
  
  if (!conditions.loanApproved) missingConditions.push('Loan not approved');
  if (!conditions.kycVerified) missingConditions.push('KYC not verified');
  if (!conditions.collateralVerified) missingConditions.push('Collateral not verified');
  
  return {
    canRelease: missingConditions.length === 0,
    missingConditions
  };
};

escrowSchema.methods.releaseFunds = function(releasedBy, reason = 'Loan conditions met') {
  if (this.status !== 'held') {
    throw new Error('Escrow must be in held status to release funds');
  }
  
  const conditionCheck = this.checkReleaseConditions();
  if (!conditionCheck.canRelease) {
    throw new Error(`Cannot release funds: ${conditionCheck.missingConditions.join(', ')}`);
  }
  
  this.status = 'released';
  this.releasedAt = new Date();
  this.releasedBy = releasedBy;
  this.releaseReason = reason;
  
  return this.save();
};

escrowSchema.methods.refundFunds = function(refundedBy, reason = 'Loan cancelled') {
  if (this.status !== 'held' && this.status !== 'pending') {
    throw new Error('Escrow must be in held or pending status to refund funds');
  }
  
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.refundedBy = refundedBy;
  this.refundReason = reason;
  
  return this.save();
};

escrowSchema.methods.updatePaymentStatus = function(status, paystackData = {}) {
  this.paymentDetails.paymentStatus = status;
  
  if (paystackData.reference) {
    this.paymentDetails.paystackReference = paystackData.reference;
  }
  
  if (paystackData.transactionId) {
    this.paymentDetails.paystackTransactionId = paystackData.transactionId;
  }
  
  if (status === 'completed') {
    this.status = 'held';
  }
  
  return this.save();
};

// Static methods
escrowSchema.statics.findByLoan = function(loanId) {
  return this.findOne({ loanId });
};

escrowSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

escrowSchema.statics.findReadyToRelease = function() {
  return this.find({
    status: 'held',
    'releaseConditions.allConditionsMet': true
  });
};

escrowSchema.statics.findOverdue = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    status: 'held',
    createdAt: { $lt: cutoffDate }
  });
};

escrowSchema.statics.getEscrowStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Escrow', escrowSchema);
