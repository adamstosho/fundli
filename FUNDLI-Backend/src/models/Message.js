const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Chat this message belongs to
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  
  // Message sender
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // File attachments (if any)
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Reply to another message (if this is a reply)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  },
  
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ status: 1 });

// Virtual for checking if message is read by a specific user
messageSchema.virtual('isReadBy').get(function() {
  return (userId) => {
    return this.readBy.some(read => read.user.toString() === userId.toString());
  };
});

// Method to mark message as read by a user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark message as delivered
messageSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get messages for a chat with pagination
messageSchema.statics.getChatMessages = async function(chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ 
    chat: chatId,
    'metadata.isDeleted': false 
  })
  .populate('sender', 'firstName lastName email userType')
  .populate('replyTo', 'content sender')
  .populate('replyTo.sender', 'firstName lastName')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
  
  return messages.reverse(); // Return in chronological order
};

// Static method to get unread message count for a user in a chat
messageSchema.statics.getUnreadCount = async function(chatId, userId) {
  const count = await this.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    readBy: { $not: { $elemMatch: { user: userId } } },
    'metadata.isDeleted': false
  });
  
  return count;
};

module.exports = mongoose.model('Message', messageSchema);
