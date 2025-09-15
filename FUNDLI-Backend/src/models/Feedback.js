const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Reference to the loan application (optional)
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: false
  },
  
  // Who sent the feedback
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Who receives the feedback
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Type of feedback (optional for new API format)
  type: {
    type: String,
    enum: ['admin_to_borrower', 'admin_to_lender', 'borrower_to_admin', 'lender_to_admin'],
    required: false
  },
  
  // Feedback subject
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  // Feedback message
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status of the feedback
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'replied'],
    default: 'sent'
  },
  
  // Whether this is a reply to another feedback
  isReply: {
    type: Boolean,
    default: false
  },
  
  // Reference to the original feedback if this is a reply
  parentFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    default: null
  },
  
  // Attachments (if any)
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  
  // Read status
  readAt: {
    type: Date,
    default: null
  },
  
  // Reply deadline (if applicable)
  deadline: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
feedbackSchema.index({ loanId: 1, createdAt: -1 });
feedbackSchema.index({ sender: 1, createdAt: -1 });
feedbackSchema.index({ recipient: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1 });

// Virtual for formatted date
feedbackSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to mark as read
feedbackSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as replied
feedbackSchema.methods.markAsReplied = function() {
  this.status = 'replied';
  return this.save();
};

// Static method to get feedback for a loan
feedbackSchema.statics.getFeedbackForLoan = function(loanId) {
  return this.find({ loanId })
    .populate('sender', 'firstName lastName email userType')
    .populate('recipient', 'firstName lastName email userType')
    .sort({ createdAt: -1 });
};

// Static method to get unread feedback for a user
feedbackSchema.statics.getUnreadFeedback = function(userId) {
  return this.find({ 
    recipient: userId, 
    status: { $in: ['sent', 'delivered'] } 
  })
  .populate('sender', 'firstName lastName email userType')
  .populate('loanId', 'loanAmount purpose status')
  .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Feedback', feedbackSchema);
