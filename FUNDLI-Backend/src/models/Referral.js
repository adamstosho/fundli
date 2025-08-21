const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // Referrer (person who referred)
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Referred person
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Referral Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  
  // Referral Code Used
  referralCode: {
    type: String,
    required: true
  },
  
  // Referral Rewards
  rewardAmount: {
    type: Number,
    default: 0
  },
  
  rewardType: {
    type: String,
    enum: ['cashback', 'bonus', 'discount'],
    default: 'cashback'
  },
  
  // Referral Conditions
  conditions: {
    minLoanAmount: {
      type: Number,
      default: 0
    },
    minInvestmentAmount: {
      type: Number,
      default: 0
    },
    kycRequired: {
      type: Boolean,
      default: true
    },
    firstTransactionRequired: {
      type: Boolean,
      default: true
    }
  },
  
  // Completion Tracking
  completedAt: Date,
  
  // What triggered the completion
  completionTrigger: {
    type: String,
    enum: ['loan_application', 'investment', 'kyc_verification', 'first_payment'],
    required: false
  },
  
  // Referral Campaign
  campaign: {
    name: String,
    description: String,
    startDate: Date,
    endDate: Date,
    rewardPercentage: {
      type: Number,
      default: 5, // 5% default
      min: 0,
      max: 100
    },
    maxReward: {
      type: Number,
      default: 1000 // $1000 max reward
    }
  },
  
  // Referral Source
  source: {
    type: String,
    enum: ['email', 'social_media', 'direct_link', 'qr_code', 'word_of_mouth'],
    default: 'direct_link'
  },
  
  // Tracking Information
  ipAddress: String,
  userAgent: String,
  clickedAt: Date,
  
  // Expiration
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  
  // Notes
  notes: String,
  
  // Admin Information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  processedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for referral age
referralSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = now - created;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiration
referralSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expiresAt) return null;
  
  const now = new Date();
  const expires = new Date(this.expiresAt);
  const diffTime = expires - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is expired
referralSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Indexes
referralSchema.index({ referrer: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ createdAt: -1 });
referralSchema.index({ expiresAt: 1 });
referralSchema.index({ 'campaign.name': 1 });

// Pre-save middleware
referralSchema.pre('save', function(next) {
  // Check if referral has expired
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  
  // Set completion date when status changes to completed
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Instance methods
referralSchema.methods.markAsCompleted = function(trigger, adminId = null) {
  this.status = 'completed';
  this.completionTrigger = trigger;
  this.completedAt = new Date();
  
  if (adminId) {
    this.processedBy = adminId;
    this.processedAt = new Date();
  }
  
  return this.save();
};

referralSchema.methods.calculateReward = function(transactionAmount) {
  if (!this.campaign || !transactionAmount) return 0;
  
  let reward = (transactionAmount * this.campaign.rewardPercentage) / 100;
  
  // Apply maximum reward limit
  if (this.campaign.maxReward && reward > this.campaign.maxReward) {
    reward = this.campaign.maxReward;
  }
  
  return Math.round(reward * 100) / 100; // Round to 2 decimal places
};

referralSchema.methods.extendExpiration = function(days) {
  if (this.expiresAt) {
    this.expiresAt.setDate(this.expiresAt.getDate() + days);
  } else {
    const date = new Date();
    date.setDate(date.getDate() + days);
    this.expiresAt = date;
  }
  
  return this.save();
};

// Static methods
referralSchema.statics.findByReferrer = function(referrerId) {
  return this.find({ referrer: referrerId });
};

referralSchema.statics.findByReferred = function(referredId) {
  return this.find({ referred: referredId });
};

referralSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

referralSchema.statics.findByReferralCode = function(code) {
  return this.find({ referralCode: code });
};

referralSchema.statics.findExpiredReferrals = function() {
  const now = new Date();
  return this.find({
    status: 'pending',
    expiresAt: { $lt: now }
  });
};

referralSchema.statics.findActiveCampaigns = function() {
  const now = new Date();
  return this.find({
    'campaign.startDate': { $lte: now },
    'campaign.endDate': { $gte: now },
    status: 'pending'
  });
};

referralSchema.statics.getReferralStats = function(userId) {
  return this.aggregate([
    {
      $match: { referrer: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRewards: { $sum: '$rewardAmount' }
      }
    }
  ]);
};

// Compound index for efficient queries
referralSchema.index({ referrer: 1, status: 1, createdAt: -1 });
referralSchema.index({ referralCode: 1, status: 1 });

module.exports = mongoose.model('Referral', referralSchema); 