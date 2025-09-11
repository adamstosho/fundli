const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Wallet balance
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },

  // Currency
  currency: {
    type: String,
    default: 'USD',
    enum: ['NGN', 'USD', 'GHS', 'ZAR']
  },

  // Wallet status
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },

  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'loan_payment', 'loan_disbursement', 'refund'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    description: {
      type: String,
      required: true
    },
    reference: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    // For transfers
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // For loan-related transactions
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    },
    // External payment reference (Paystack, etc.)
    externalReference: String,
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Wallet limits
  limits: {
    dailyDepositLimit: {
      type: Number,
      default: 10000 // $10,000
    },
    dailyWithdrawalLimit: {
      type: Number,
      default: 5000 // $5,000
    },
    dailyTransferLimit: {
      type: Number,
      default: 2000 // $2,000
    },
    monthlyDepositLimit: {
      type: Number,
      default: 100000 // $100,000
    },
    monthlyWithdrawalLimit: {
      type: Number,
      default: 50000 // $50,000
    }
  },

  // Daily usage tracking
  dailyUsage: {
    depositAmount: {
      type: Number,
      default: 0
    },
    withdrawalAmount: {
      type: Number,
      default: 0
    },
    transferAmount: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },

  // Monthly usage tracking
  monthlyUsage: {
    depositAmount: {
      type: Number,
      default: 0
    },
    withdrawalAmount: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },

  // Security settings
  security: {
    pin: {
      type: String,
      select: false
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastLogin: Date,
    failedAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date
  },

  // Wallet statistics
  stats: {
    totalDeposits: {
      type: Number,
      default: 0
    },
    totalWithdrawals: {
      type: Number,
      default: 0
    },
    totalTransfers: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes (user and transactions.reference already have unique indexes defined in schema)
walletSchema.index({ 'transactions.externalReference': 1 });
walletSchema.index({ 'transactions.createdAt': -1 });

// Virtual for available balance
walletSchema.virtual('availableBalance').get(function() {
  return this.balance;
});

// Method to check if transaction is within limits
walletSchema.methods.checkLimits = function(transactionType, amount) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Reset daily usage if it's a new day
  if (this.dailyUsage.lastResetDate < startOfDay) {
    this.dailyUsage.depositAmount = 0;
    this.dailyUsage.withdrawalAmount = 0;
    this.dailyUsage.transferAmount = 0;
    this.dailyUsage.lastResetDate = startOfDay;
  }

  // Reset monthly usage if it's a new month
  if (this.monthlyUsage.lastResetDate < startOfMonth) {
    this.monthlyUsage.depositAmount = 0;
    this.monthlyUsage.withdrawalAmount = 0;
    this.monthlyUsage.lastResetDate = startOfMonth;
  }

  switch (transactionType) {
    case 'deposit':
      if (this.dailyUsage.depositAmount + amount > this.limits.dailyDepositLimit) {
        return { allowed: false, reason: 'Daily deposit limit exceeded' };
      }
      if (this.monthlyUsage.depositAmount + amount > this.limits.monthlyDepositLimit) {
        return { allowed: false, reason: 'Monthly deposit limit exceeded' };
      }
      break;
    case 'withdrawal':
      if (this.dailyUsage.withdrawalAmount + amount > this.limits.dailyWithdrawalLimit) {
        return { allowed: false, reason: 'Daily withdrawal limit exceeded' };
      }
      if (this.monthlyUsage.withdrawalAmount + amount > this.limits.monthlyWithdrawalLimit) {
        return { allowed: false, reason: 'Monthly withdrawal limit exceeded' };
      }
      break;
    case 'transfer':
      if (this.dailyUsage.transferAmount + amount > this.limits.dailyTransferLimit) {
        return { allowed: false, reason: 'Daily transfer limit exceeded' };
      }
      break;
  }

  return { allowed: true };
};

// Simple method to add transaction (no balance changes)
walletSchema.methods.addTransaction = function(transactionData) {
  this.transactions.push(transactionData);
  this.stats.transactionCount += 1;
};

// Method to update wallet balance
walletSchema.methods.updateBalance = function(amount, transactionType = 'deposit') {
  if (transactionType === 'deposit') {
    this.balance += amount;
    this.stats.totalDeposits += amount;
  } else if (transactionType === 'withdrawal') {
    this.balance -= amount;
    this.stats.totalWithdrawals += amount;
  } else if (transactionType === 'transfer_in') {
    this.balance += amount;
    this.stats.totalTransfers += amount;
  } else if (transactionType === 'transfer_out') {
    this.balance -= amount;
    this.stats.totalTransfers += amount;
  }
  
  // Ensure balance doesn't go negative
  if (this.balance < 0) {
    throw new Error('Insufficient funds');
  }
};

// Pre-save middleware to ensure balance is not negative
walletSchema.pre('save', function(next) {
  if (this.balance < 0) {
    return next(new Error('Wallet balance cannot be negative'));
  }
  next();
});

module.exports = mongoose.model('Wallet', walletSchema);
