const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'loan_application',
      'loan_approval',
      'loan_rejection',
      'loan_funding',
      'repayment_due',
      'repayment_received',
      'investment_opportunity',
      'pool_created',
      'pool_funded',
      'kyc_approval',
      'kyc_rejection',
      'referral_completed',
      'referral_reward',
      'system_announcement',
      'security_alert',
      'payment_failed',
      'account_verification',
      'welcome_message'
    ],
    required: true
  },
  
  // Notification Title
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  // Notification Message
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Detailed Content (for longer notifications)
  content: {
    type: String,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Notification Status
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  
  // Read Status
  readAt: Date,
  
  // Action Required
  actionRequired: {
    type: Boolean,
    default: false
  },
  
  // Action Details
  action: {
    type: {
      type: String,
      enum: ['view', 'approve', 'reject', 'pay', 'verify', 'contact', 'none'],
      default: 'none'
    },
    url: String,
    buttonText: String,
    expiresAt: Date
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
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Metadata
  metadata: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    dueDate: Date,
    riskLevel: String,
    roi: Number,
    // Add more fields as needed
  },
  
  // Delivery Channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // Email Status
  emailStatus: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    bounced: {
      type: Boolean,
      default: false
    },
    bounceReason: String
  },
  
  // Push Notification Status
  pushStatus: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date
  },
  
  // SMS Status
  smsStatus: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date
  },
  
  // Scheduling
  scheduledFor: Date,
  
  // Expiration
  expiresAt: Date,
  
  // Template Information
  template: {
    name: String,
    version: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // User Preferences Override
  userPreferencesOverride: {
    type: Boolean,
    default: false
  },
  
  // Notes (for admin use)
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for notification age
notificationSchema.virtual('ageInMinutes').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = now - created;
  return Math.ceil(diffTime / (1000 * 60));
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for is scheduled
notificationSchema.virtual('isScheduled').get(function() {
  if (!this.scheduledFor) return false;
  return new Date() < this.scheduledFor;
});

// Indexes
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'relatedEntities.loan': 1 });
notificationSchema.index({ 'relatedEntities.pool': 1 });

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set expiration if not set (default: 30 days)
  if (!this.expiresAt) {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    this.expiresAt = date;
  }
  
  // Check if notification has expired
  if (this.isExpired && this.status === 'unread') {
    this.status = 'archived';
  }
  
  // Set read timestamp when status changes to read
  if (this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsArchived = function() {
  this.status = 'archived';
  return this.save();
};

notificationSchema.methods.scheduleFor = function(date) {
  this.scheduledFor = date;
  return this.save();
};

notificationSchema.methods.extendExpiration = function(days) {
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
notificationSchema.statics.findByRecipient = function(recipientId) {
  return this.find({ recipient: recipientId });
};

notificationSchema.statics.findUnread = function(recipientId) {
  return this.find({ recipient: recipientId, status: 'unread' });
};

notificationSchema.statics.findByType = function(type) {
  return this.find({ type });
};

notificationSchema.statics.findScheduled = function() {
  const now = new Date();
  return this.find({
    scheduledFor: { $lte: now },
    status: 'unread'
  });
};

notificationSchema.statics.findExpired = function() {
  const now = new Date();
  return this.find({
    expiresAt: { $lt: now },
    status: 'unread'
  });
};

notificationSchema.statics.getNotificationStats = function(userId) {
  return this.aggregate([
    {
      $match: { recipient: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

notificationSchema.statics.markAllAsRead = function(recipientId) {
  return this.updateMany(
    { recipient: recipientId, status: 'unread' },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

notificationSchema.statics.cleanupExpired = function() {
  const now = new Date();
  return this.updateMany(
    {
      expiresAt: { $lt: now },
      status: 'unread'
    },
    {
      status: 'archived'
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema); 