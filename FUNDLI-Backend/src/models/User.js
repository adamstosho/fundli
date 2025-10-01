const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // User Type and Role
  userType: {
    type: String,
    enum: ['borrower', 'lender', 'admin'],
    required: [true, 'User type is required'],
    default: 'borrower'
  },
  
  // Company Information (for lenders)
  company: {
    name: String,
    registrationNumber: String,
    industry: String,
    website: String
  },
  
  // KYC Information
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'approved', 'rejected'],
    default: 'pending'
  },
  
  kycVerified: {
    type: Boolean,
    default: false
  },

  // KYC Facial Verification
  documentImage: {
    type: String,
    default: null
  },

  liveFaceImage: {
    type: String,
    default: null
  },

  verificationScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },

  kycVerificationDetails: {
    documentType: {
      type: String,
      enum: ['passport', 'national_id', 'driver_license', 'other'],
      default: null
    },
    documentNumber: {
      type: String,
      default: null
    },
    verificationDate: {
      type: Date,
      default: null
    },
    verificationMethod: {
      type: String,
      enum: ['facial_verification', 'manual_review'],
      default: 'facial_verification'
    },
    livenessCheckPassed: {
      type: Boolean,
      default: false
    }
  },
  
  kycData: {
    bvn: {
      number: String,
      verified: Boolean,
      verificationResult: Object,
      verifiedAt: Date
    },
    bankAccount: {
      accountNumber: String,
      bankCode: String,
      bankName: String,
      accountName: String,
      verified: Boolean,
      verificationResult: Object,
      verifiedAt: Date
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String
  },
  
  kycDocuments: {
    idType: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license', 'voters_card']
    },
    idNumber: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    documents: {
      idFront: {
        url: String,
        publicId: String,
        uploadedAt: Date
      },
      idBack: {
        url: String,
        publicId: String,
        uploadedAt: Date
      },
      selfie: {
        url: String,
        publicId: String,
        uploadedAt: Date
      },
      proofOfAddress: {
        url: String,
        publicId: String,
        uploadedAt: Date
      }
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String
  },
  
  // Profile Information
  profilePicture: {
    url: String,
    publicId: String
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Financial Information
  creditScore: {
    type: Number,
    min: 0,
    max: 850,
    default: 0
  },

  // Gamified reliability points and badges for borrowers
  reliabilityPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [
    {
      key: { type: String, required: true },
      name: { type: String, required: true },
      icon: { type: String },
      earnedAt: { type: Date, default: Date.now }
    }
  ],
  
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  // Investment tracking for lenders
  investmentStats: {
    totalInvested: {
      type: Number,
      default: 0,
      min: 0
    },
    totalLoansFunded: {
      type: Number,
      default: 0,
      min: 0
    },
    averageInvestmentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastInvestmentDate: Date,
    investmentHistory: [{
      loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan'
      },
      amount: {
        type: Number,
        required: true
      },
      borrowerName: String,
      investmentDate: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'completed', 'defaulted'],
        default: 'active'
      }
    }]
  },
  
  // Referral Information
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  referralEarnings: {
    type: Number,
    default: 0
  },
  
  // New referral program fields
  referralStats: {
    totalReferred: {
      type: Number,
      default: 0
    },
    completedActions: {
      type: Number,
      default: 0
    },
    isEligibleForRewards: {
      type: Boolean,
      default: false
    },
    rewardEligibilityDate: Date
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  twoFactorSecret: String,
  tempTwoFactorSecret: String,
  twoFactorBackupCodes: [String],
  twoFactorEnabledAt: Date,
  twoFactorDisabledAt: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Login Tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for isLocked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes
userSchema.index({ kycStatus: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Generate referral code if not exists
    if (!this.referralCode) {
      this.referralCode = this.generateReferralCode();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, userType: this.userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to update investment statistics
userSchema.methods.updateInvestmentStats = function(loanId, amount, borrowerName) {
  // Initialize investmentStats if it doesn't exist
  if (!this.investmentStats) {
    this.investmentStats = {
      totalInvested: 0,
      totalLoansFunded: 0,
      averageInvestmentAmount: 0,
      investmentHistory: []
    };
  }

  // Update total invested
  this.investmentStats.totalInvested += amount;
  
  // Update total loans funded
  this.investmentStats.totalLoansFunded += 1;
  
  // Update average investment amount
  this.investmentStats.averageInvestmentAmount = this.investmentStats.totalInvested / this.investmentStats.totalLoansFunded;
  
  // Update last investment date
  this.investmentStats.lastInvestmentDate = new Date();
  
  // Add to investment history
  this.investmentStats.investmentHistory.push({
    loanId: loanId,
    amount: amount,
    borrowerName: borrowerName,
    investmentDate: new Date(),
    status: 'active'
  });

  return this.save();
};

// Static methods
userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referralCode });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema); 