const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Transaction Type
  type: {
    type: String,
    enum: [
      'loan_disbursement',
      'loan_repayment',
      'investment',
      'investment_return',
      'referral_reward',
      'fee_charge',
      'refund',
      'wallet_funding',
      'wallet_withdrawal',
      'kyc_verification_fee',
      'late_fee',
      'default_penalty',
      'pool_creation_fee',
      'management_fee',
      'performance_fee'
    ],
    required: true
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'NGN'] // Add more currencies as needed
  },
  
  // Fee Information
  fees: {
    processing: {
      type: Number,
      default: 0
    },
    platform: {
      type: Number,
      default: 0
    },
    thirdParty: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Net Amount (after fees)
  netAmount: {
    type: Number,
    required: true
  },
  
  // Parties Involved
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related Entities
  relatedEntities: {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    },
    pool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LendingPool'
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral'
    }
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: [
      'bank_transfer',
      'card_payment',
      'wallet_balance',
      'mobile_money',
      'ussd',
      'qr_code',
      'bank_account',
      'internal_transfer'
    ],
    required: true
  },
  
  // Payment Details
  paymentDetails: {
    reference: String,
    gateway: {
      type: String,
      enum: ['flutterwave', 'manual', 'internal'],
      default: 'flutterwave'
    },
    gatewayTransactionId: String,
    gatewayReference: String,
    cardLast4: String,
    cardBrand: String,
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String,
    iban: String,
    // Flutterwave specific fields
    flutterwave: {
      txRef: String,           // Flutterwave transaction reference
      orderRef: String,        // Order reference
      raveRef: String,         // Rave reference
      chargeResponseCode: String, // Charge response code
      chargeResponseMessage: String, // Charge response message
      customerEmail: String,   // Customer email
      customerPhone: String,   // Customer phone
      customerName: String,    // Customer name
      paymentPlan: String,     // Payment plan if applicable
      paymentPage: String,     // Payment page used
      hostedPage: String,      // Hosted page reference
      redirectUrl: String,     // Redirect URL after payment
      meta: mongoose.Schema.Types.Mixed // Additional metadata
    }
  },
  
  // Transaction Description
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Additional Details
  details: {
    installmentNumber: Number,
    principal: Number,
    interest: Number,
    lateFees: Number,
    riskLevel: String,
    roi: Number,
    duration: Number,
    purpose: String
  },
  
  // Processing Information
  processingStartedAt: Date,
  processingCompletedAt: Date,
  processingDuration: Number, // in milliseconds
  
  // Failure Information
  failureReason: String,
  failureCode: String,
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Reversal Information
  reversedAt: Date,
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reversalReason: String,
  
  // Compliance and Security
  complianceFlags: [{
    type: String,
    enum: [
      'high_value',
      'suspicious_pattern',
      'sanctions_check',
      'aml_alert',
      'kyc_required',
      'source_of_funds'
    ]
  }],
  
  riskScore: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  // Notes
  notes: String,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    location: {
      country: String,
      city: String,
      coordinates: [Number] // [longitude, latitude]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total amount including fees
transactionSchema.virtual('totalAmount').get(function() {
  return this.amount + this.fees.total;
});

// Virtual for transaction age
transactionSchema.virtual('ageInMinutes').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = now - created;
  return Math.ceil(diffTime / (1000 * 60));
});

// Virtual for processing time
transactionSchema.virtual('processingTime').get(function() {
  if (this.processingStartedAt && this.processingCompletedAt) {
    return this.processingCompletedAt - this.processingStartedAt;
  }
  return null;
});

// Indexes
transactionSchema.index({ sender: 1 });
transactionSchema.index({ recipient: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ amount: 1 });
transactionSchema.index({ 'relatedEntities.loan': 1 });
transactionSchema.index({ 'relatedEntities.pool': 1 });
transactionSchema.index({ 'paymentDetails.reference': 1 });
transactionSchema.index({ 'paymentDetails.gatewayTransactionId': 1 });

// Compound indexes for efficient queries
transactionSchema.index({ sender: 1, status: 1, createdAt: -1 });
transactionSchema.index({ recipient: 1, status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    this.transactionId = this.generateTransactionId();
  }
  
  // Calculate net amount
  this.netAmount = this.amount - this.fees.total;
  
  // Calculate total fees
  this.fees.total = this.fees.processing + this.fees.platform + this.fees.thirdParty;
  
  // Set processing start time
  if (this.isNew && this.status === 'processing') {
    this.processingStartedAt = new Date();
  }
  
  // Set processing completion time
  if (this.status === 'completed' && !this.processingCompletedAt) {
    this.processingCompletedAt = new Date();
  }
  
  // Calculate processing duration
  if (this.processingStartedAt && this.processingCompletedAt) {
    this.processingDuration = this.processingCompletedAt - this.processingStartedAt;
  }
  
  next();
});

// Instance methods
transactionSchema.methods.generateTransactionId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 9);
  return `TXN${timestamp}${random}`.toUpperCase();
};

transactionSchema.methods.startProcessing = function() {
  this.status = 'processing';
  this.processingStartedAt = new Date();
  return this.save();
};

transactionSchema.methods.completeProcessing = function() {
  this.status = 'completed';
  this.processingCompletedAt = new Date();
  if (this.processingStartedAt) {
    this.processingDuration = this.processingCompletedAt - this.processingStartedAt;
  }
  return this.save();
};

transactionSchema.methods.failProcessing = function(reason, code) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  this.processingCompletedAt = new Date();
  if (this.processingStartedAt) {
    this.processingDuration = this.processingCompletedAt - this.processingStartedAt;
  }
  return this.save();
};

transactionSchema.methods.reverse = function(reason, adminId) {
  this.status = 'reversed';
  this.reversedAt = new Date();
  this.reversedBy = adminId;
  this.reversalReason = reason;
  return this.save();
};

// Static methods
transactionSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [{ sender: userId }, { recipient: userId }]
  });
};

transactionSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

transactionSchema.statics.findByType = function(type) {
  return this.find({ type });
};

transactionSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

transactionSchema.statics.findHighValueTransactions = function(threshold) {
  return this.find({ amount: { $gte: threshold } });
};

transactionSchema.statics.getTransactionStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: mongoose.Types.ObjectId(userId) }, { recipient: mongoose.Types.ObjectId(userId) }]
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: 1 },
        totalFees: { $sum: null }
      }
    }
  ]);
};

transactionSchema.statics.getDailyStats = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema); 