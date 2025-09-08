const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lendingPool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LendingPool',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: false // Optional, for direct loan investments
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  expectedReturn: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'defaulted', 'cancelled'],
    default: 'pending'
  },
  investmentDate: {
    type: Date,
    default: Date.now
  },
  maturityDate: {
    type: Date,
    required: true
  },
  actualReturn: {
    type: Number,
    default: 0
  },
  returnsReceived: {
    type: Number,
    default: 0
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentDate: {
    type: Date
  },
  paymentSchedule: [{
    dueDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    principal: {
      type: Number,
      required: true
    },
    interest: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'defaulted'],
      default: 'pending'
    },
    paidDate: {
      type: Date
    },
    paidAmount: {
      type: Number,
      default: 0
    }
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  // Investment performance metrics
  performance: {
    totalReturn: {
      type: Number,
      default: 0
    },
    returnPercentage: {
      type: Number,
      default: 0
    },
    currentValue: {
      type: Number,
      default: 0
    },
    realizedGains: {
      type: Number,
      default: 0
    },
    unrealizedGains: {
      type: Number,
      default: 0
    }
  },
  // Investment terms and conditions
  terms: {
    earlyWithdrawalPenalty: {
      type: Number,
      default: 0
    },
    minimumInvestmentPeriod: {
      type: Number, // in days
      default: 0
    },
    autoReinvest: {
      type: Boolean,
      default: false
    }
  },
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true
});

// Indexes for better query performance
investmentSchema.index({ investor: 1, status: 1 });
investmentSchema.index({ lendingPool: 1 });
investmentSchema.index({ loan: 1 });
investmentSchema.index({ status: 1, investmentDate: -1 });
investmentSchema.index({ maturityDate: 1 });
investmentSchema.index({ nextPaymentDate: 1 });

// Virtual for calculating days until maturity
investmentSchema.virtual('daysUntilMaturity').get(function() {
  if (!this.maturityDate) return null;
  const now = new Date();
  const diffTime = this.maturityDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating total expected return
investmentSchema.virtual('totalExpectedReturn').get(function() {
  return this.amount + this.expectedReturn;
});

// Virtual for calculating current return percentage
investmentSchema.virtual('currentReturnPercentage').get(function() {
  if (this.amount === 0) return 0;
  return ((this.returnsReceived / this.amount) * 100).toFixed(2);
});

// Pre-save middleware to update performance metrics
investmentSchema.pre('save', function(next) {
  // Update performance metrics
  this.performance.totalReturn = this.returnsReceived;
  this.performance.returnPercentage = this.amount > 0 ? 
    (this.returnsReceived / this.amount) * 100 : 0;
  this.performance.currentValue = this.amount + this.returnsReceived;
  this.performance.realizedGains = this.returnsReceived;
  this.performance.unrealizedGains = this.expectedReturn - this.returnsReceived;

  // Update next payment date
  if (this.paymentSchedule && this.paymentSchedule.length > 0) {
    const nextPayment = this.paymentSchedule.find(payment => 
      payment.status === 'pending'
    );
    if (nextPayment) {
      this.nextPaymentDate = nextPayment.dueDate;
    }
  }

  this.updatedAt = new Date();
  next();
});

// Static method to get investment statistics for a user
investmentSchema.statics.getUserInvestmentStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { investor: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalInvestments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalReturns: { $sum: '$returnsReceived' },
        activeInvestments: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedInvestments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageReturn: { $avg: '$performance.returnPercentage' }
      }
    }
  ]);

  return stats[0] || {
    totalInvestments: 0,
    totalAmount: 0,
    totalReturns: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    averageReturn: 0
  };
};

// Static method to get investments by status
investmentSchema.statics.getInvestmentsByStatus = function(status, limit = 10) {
  return this.find({ status })
    .populate('investor', 'firstName lastName email')
    .populate('lendingPool', 'name description')
    .populate('loan', 'loanAmount purpose')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance method to calculate next payment
investmentSchema.methods.calculateNextPayment = function() {
  if (!this.paymentSchedule || this.paymentSchedule.length === 0) {
    return null;
  }

  const nextPayment = this.paymentSchedule.find(payment => 
    payment.status === 'pending'
  );

  return nextPayment ? {
    dueDate: nextPayment.dueDate,
    amount: nextPayment.amount,
    principal: nextPayment.principal,
    interest: nextPayment.interest
  } : null;
};

// Instance method to mark payment as received
investmentSchema.methods.markPaymentReceived = function(paymentId, amount, date = new Date()) {
  const payment = this.paymentSchedule.id(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  payment.status = 'paid';
  payment.paidDate = date;
  payment.paidAmount = amount;
  
  this.returnsReceived += amount;
  this.lastPaymentDate = date;

  // Check if all payments are completed
  const allPaid = this.paymentSchedule.every(p => p.status === 'paid');
  if (allPaid) {
    this.status = 'completed';
  }

  return this.save();
};

module.exports = mongoose.model('Investment', investmentSchema);
