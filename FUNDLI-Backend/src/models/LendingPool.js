const mongoose = require('mongoose');

const lendingPoolSchema = new mongoose.Schema({
  // Basic Pool Information
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  name: {
    type: String,
    required: [true, 'Pool name is required'],
    trim: true,
    maxlength: [100, 'Pool name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Pool description is required'],
    maxlength: [1000, 'Pool description cannot exceed 1000 characters']
  },
  
  // Pool Configuration
  poolSize: {
    type: Number,
    required: [true, 'Pool size is required'],
    min: [0, 'Pool size must be positive'],
    max: [999999999, 'No practical maximum pool size']
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'NGN', 'EUR', 'GBP', 'GHS', 'ZAR'],
    required: [true, 'Currency is required']
  },
  
  fundedAmount: {
    type: Number,
    default: 0
  },
  
  minInvestment: {
    type: Number,
    required: [true, 'Minimum investment is required'],
    min: [0, 'Minimum investment must be non-negative']
  },
  
  maxInvestment: {
    type: Number,
    required: [true, 'Maximum investment is required'],
    min: [0, 'Maximum investment must be non-negative']
  },
  
  // Investment Terms
  duration: {
    type: Number,
    required: [true, 'Pool duration is required'],
    min: [1, 'Minimum duration is 1 month'],
    max: [999999, 'No practical maximum duration']
  },
  
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate must be non-negative'],
    max: [1000, 'No practical maximum interest rate']
  },
  
  // Pool Status
  status: {
    type: String,
    enum: ['draft', 'active', 'funding', 'funded', 'closed', 'cancelled'],
    default: 'draft'
  },
  
  // Funding Information
  fundingDeadline: {
    type: Date,
    required: [true, 'Funding deadline is required']
  },
  
  fundingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Investors
  investors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    investedAt: Date,
    expectedReturn: Number,
    status: {
      type: String,
      enum: ['active', 'withdrawn', 'completed'],
      default: 'active'
    }
  }],
  
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  riskFactors: [{
    factor: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    description: String
  }],
  
  // Pool Performance
  totalInvested: {
    type: Number,
    default: 0
  },
  
  totalReturns: {
    type: Number,
    default: 0
  },
  
  averageROI: {
    type: Number,
    default: 0
  },
  
  // Loans in Pool
  loans: [{
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    },
    allocation: Number, // Percentage of pool allocated to this loan
    addedAt: Date
  }],
  
  // Pool Management
  isPublic: {
    type: Boolean,
    default: true
  },
  
  autoReinvest: {
    type: Boolean,
    default: false
  },
  
  earlyWithdrawalFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Fees and Charges
  managementFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  performanceFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 20
  },
  
  // Pool Statistics
  totalInvestors: {
    type: Number,
    default: 0
  },
  
  averageInvestment: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: Date,
  activatedAt: Date,
  closedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for funding percentage
lendingPoolSchema.virtual('fundingPercentage').get(function() {
  if (this.poolSize > 0) {
    return Math.round((this.fundedAmount / this.poolSize) * 100);
  }
  return 0;
});

// Virtual for days remaining
lendingPoolSchema.virtual('daysRemaining').get(function() {
  if (this.fundingDeadline) {
    const now = new Date();
    const deadline = new Date(this.fundingDeadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return null;
});

// Virtual for pool performance
lendingPoolSchema.virtual('performance').get(function() {
  if (this.totalInvested > 0) {
    return {
      totalROI: ((this.totalReturns / this.totalInvested) * 100).toFixed(2),
      annualizedROI: this.calculateAnnualizedROI()
    };
  }
  return { totalROI: 0, annualizedROI: 0 };
});

// Indexes
lendingPoolSchema.index({ creator: 1 });
lendingPoolSchema.index({ status: 1 });
lendingPoolSchema.index({ riskLevel: 1 });
lendingPoolSchema.index({ interestRate: 1 });
lendingPoolSchema.index({ createdAt: -1 });
lendingPoolSchema.index({ 'fundingDeadline': 1 });
lendingPoolSchema.index({ isPublic: 1 });

// Pre-save middleware
lendingPoolSchema.pre('save', function(next) {
  // Calculate funding progress
  if (this.poolSize > 0) {
    this.fundingProgress = Math.round((this.fundedAmount / this.poolSize) * 100);
  }
  
  // Set creation date
  if (this.isNew) {
    this.createdAt = new Date();
  }
  
  // Update pool status based on funding
  if (this.fundingProgress >= 100 && this.status === 'funding') {
    this.status = 'funded';
  }
  
  // Calculate average investment
  if (this.investors.length > 0) {
    this.totalInvestors = this.investors.length;
    this.averageInvestment = this.fundedAmount / this.totalInvestors;
  }
  
  next();
});

// Instance methods
lendingPoolSchema.methods.addInvestment = function(userId, amount) {
  if (amount < this.minInvestment || amount > this.maxInvestment) {
    throw new Error('Investment amount is outside allowed range');
  }
  
  if (this.fundedAmount + amount > this.poolSize) {
    throw new Error('Investment would exceed pool size');
  }
  
  const expectedReturn = amount * (1 + (this.interestRate / 100));
  
  this.investors.push({
    user: userId,
    amount: amount,
    investedAt: new Date(),
    expectedReturn: expectedReturn
  });
  
  this.fundedAmount += amount;
  this.totalInvested += amount;
  
  return this.save();
};

lendingPoolSchema.methods.calculateAnnualizedROI = function() {
  if (this.totalInvested === 0 || !this.createdAt) return 0;
  
  const now = new Date();
  const poolAge = (now - this.createdAt) / (1000 * 60 * 60 * 24 * 365); // in years
  
  if (poolAge === 0) return 0;
  
  return ((this.totalReturns / this.totalInvested) / poolAge * 100).toFixed(2);
};

lendingPoolSchema.methods.updateReturns = function(returns) {
  this.totalReturns += returns;
  this.averageROI = this.totalReturns / this.totalInvested * 100;
  return this.save();
};

// Static methods
lendingPoolSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

lendingPoolSchema.statics.findByCreator = function(creatorId) {
  return this.find({ creator: creatorId });
};

lendingPoolSchema.statics.findPublicPools = function() {
  return this.find({ isPublic: true, status: { $in: ['active', 'funding'] } });
};

lendingPoolSchema.statics.findByRiskLevel = function(riskLevel) {
  return this.find({ riskLevel, status: { $in: ['active', 'funding'] } });
};

lendingPoolSchema.statics.findExpiredPools = function() {
  const now = new Date();
  return this.find({
    status: 'funding',
    fundingDeadline: { $lt: now }
  });
};

module.exports = mongoose.model('LendingPool', lendingPoolSchema); 