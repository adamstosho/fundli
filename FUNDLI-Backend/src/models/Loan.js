const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  // Basic Loan Information
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [100, 'Minimum loan amount is $100'],
    max: [1000000, 'Maximum loan amount is $1,000,000']
  },
  
  purpose: {
    type: String,
    required: [true, 'Loan purpose is required'],
    enum: [
      'business',
      'education',
      'home_improvement',
      'debt_consolidation',
      'medical',
      'vehicle',
      'personal',
      'investment',
      'other'
    ]
  },
  
  purposeDescription: {
    type: String,
    required: [true, 'Purpose description is required'],
    maxlength: [500, 'Purpose description cannot exceed 500 characters']
  },
  
  duration: {
    type: Number,
    required: [true, 'Loan duration is required'],
    min: [1, 'Minimum duration is 1 month'],
    max: [120, 'Maximum duration is 120 months']
  },
  
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0.01, 'Minimum interest rate is 0.01%'],
    max: [100, 'Maximum interest rate is 100%']
  },
  
  // Repayment Information
  repaymentSchedule: {
    type: String,
    enum: ['monthly', 'bi-weekly', 'weekly'],
    default: 'monthly'
  },
  
  monthlyPayment: {
    type: Number,
    required: true
  },
  
  totalRepayment: {
    type: Number,
    required: true
  },
  
  totalInterest: {
    type: Number,
    required: true
  },
  
  // Collateral Information
  collateral: {
    type: {
      type: String,
      enum: ['real_estate', 'vehicle', 'equipment', 'inventory', 'securities', 'other']
    },
    description: String,
    estimatedValue: Number,
    documents: [{
      name: String,
      url: String,
      publicId: String,
      uploadedAt: Date
    }]
  },
  
  // Loan Status and Progress
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'funded', 'active', 'completed', 'defaulted', 'rejected'],
    default: 'draft'
  },
  
  fundingProgress: {
    fundedAmount: {
      type: Number,
      default: 0
    },
    investors: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      investedAt: Date
    }],
    targetAmount: {
      type: Number,
      required: true
    },
    fundingDeadline: Date
  },
  
  // Risk Assessment
  riskScore: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  riskFactors: [{
    factor: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  rejectionReason: String,
  
  // Loan Terms
  startDate: Date,
  endDate: Date,
  
  // Repayment Tracking
  repayments: [{
    installmentNumber: Number,
    dueDate: Date,
    amount: Number,
    principal: Number,
    interest: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'defaulted'],
      default: 'pending'
    },
    paidAt: Date,
    lateFees: {
      type: Number,
      default: 0
    }
  }],
  
  // Financial Tracking
  amountPaid: {
    type: Number,
    default: 0
  },
  
  amountRemaining: {
    type: Number,
    required: true
  },
  
  nextPaymentDate: Date,
  
  // Default and Collections
  isDefaulted: {
    type: Boolean,
    default: false
  },
  
  defaultedAt: Date,
  
  collectionsStatus: {
    type: String,
    enum: ['none', 'in_progress', 'completed'],
    default: 'none'
  },
  
  // Loan Category and Tags
  category: {
    type: String,
    enum: ['secured', 'unsecured'],
    default: 'unsecured'
  },
  
  tags: [String],
  
  // Additional Information
  notes: String,
  
  // Timestamps
  submittedAt: Date,
  fundedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for funding percentage
loanSchema.virtual('fundingPercentage').get(function() {
  if (this.fundingProgress && this.fundingProgress.targetAmount) {
    return Math.round((this.fundingProgress.fundedAmount / this.fundingProgress.targetAmount) * 100);
  }
  return 0;
});

// Virtual for days remaining
loanSchema.virtual('daysRemaining').get(function() {
  if (this.fundingProgress && this.fundingProgress.fundingDeadline) {
    const now = new Date();
    const deadline = new Date(this.fundingProgress.fundingDeadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return null;
});

// Virtual for loan progress
loanSchema.virtual('loanProgress').get(function() {
  if (this.status === 'active' && this.duration) {
    const totalDays = this.duration * 30; // Approximate
    const startDate = this.startDate || this.createdAt;
    const now = new Date();
    const elapsedDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }
  return 0;
});

// Indexes
loanSchema.index({ borrower: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ purpose: 1 });
loanSchema.index({ riskScore: 1 });
loanSchema.index({ createdAt: -1 });
loanSchema.index({ 'fundingProgress.fundingDeadline': 1 });
loanSchema.index({ nextPaymentDate: 1 });

// Pre-save middleware
loanSchema.pre('save', function(next) {
  // Calculate loan amounts if not set
  if (this.loanAmount && this.interestRate && this.duration && !this.monthlyPayment) {
    const monthlyRate = this.interestRate / 100 / 12;
    const numberOfPayments = this.duration;
    
    if (monthlyRate > 0) {
      this.monthlyPayment = (this.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      this.monthlyPayment = this.loanAmount / numberOfPayments;
    }
    
    this.totalRepayment = this.monthlyPayment * numberOfPayments;
    this.totalInterest = this.totalRepayment - this.loanAmount;
    this.amountRemaining = this.totalRepayment;
  }
  
  // Set funding target if not set
  if (!this.fundingProgress.targetAmount) {
    this.fundingProgress.targetAmount = this.loanAmount;
  }
  
  next();
});

// Instance methods
loanSchema.methods.updateFundingProgress = function(investorId, amount) {
  this.fundingProgress.fundedAmount += amount;
  this.fundingProgress.investors.push({
    user: investorId,
    amount: amount,
    investedAt: new Date()
  });
  
  // Check if fully funded
  if (this.fundingProgress.fundedAmount >= this.fundingProgress.targetAmount) {
    this.status = 'funded';
    this.fundedAt = new Date();
  }
  
  return this.save();
};

loanSchema.methods.processRepayment = function(amount, installmentNumber) {
  const repayment = this.repayments.find(r => r.installmentNumber === installmentNumber);
  
  if (repayment && repayment.status === 'pending') {
    repayment.status = 'paid';
    repayment.paidAt = new Date();
    this.amountPaid += amount;
    this.amountRemaining -= amount;
    
    // Update next payment date
    const nextRepayment = this.repayments.find(r => r.status === 'pending');
    if (nextRepayment) {
      this.nextPaymentDate = nextRepayment.dueDate;
    } else {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  
  return this.save();
};

// Static methods
loanSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

loanSchema.statics.findByBorrower = function(borrowerId) {
  return this.find({ borrower: borrowerId });
};

loanSchema.statics.findByRiskScore = function(minScore, maxScore) {
  return this.find({ riskScore: { $gte: minScore, $lte: maxScore } });
};

loanSchema.statics.findOverdueLoans = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    nextPaymentDate: { $lt: now },
    'repayments.status': 'overdue'
  });
};

module.exports = mongoose.model('Loan', loanSchema); 