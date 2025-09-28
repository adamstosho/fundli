const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Related loan (if applicable)
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  
  // Related lending pool (if applicable)
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LendingPool'
  },
  
  // Chat metadata
  chatType: {
    type: String,
    enum: ['loan_discussion', 'pool_discussion', 'general', 'admin_support'],
    default: 'loan_discussion'
  },
  
  // Chat status
  status: {
    type: String,
    enum: ['active', 'archived', 'closed'],
    default: 'active'
  },
  
  // Last message info for quick access
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Unread counts for each participant
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  
  // Additional metadata for different chat types
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Chat settings
  settings: {
    allowNotifications: {
      type: Boolean,
      default: true
    },
    autoArchive: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ loan: 1 });
chatSchema.index({ pool: 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for getting the other participant
chatSchema.virtual('otherParticipant').get(function() {
  return this.participants.find(p => p.toString() !== this.sender?.toString());
});

// Method to get unread count for a specific user
chatSchema.methods.getUnreadCount = function(userId) {
  const unreadData = this.unreadCounts.find(u => u.user.toString() === userId.toString());
  return unreadData ? unreadData.count : 0;
};

// Method to mark messages as read for a user
chatSchema.methods.markAsRead = function(userId) {
  const unreadData = this.unreadCounts.find(u => u.user.toString() === userId.toString());
  if (unreadData) {
    unreadData.count = 0;
  } else {
    this.unreadCounts.push({ user: userId, count: 0 });
  }
  return this.save();
};

// Method to increment unread count for a user
chatSchema.methods.incrementUnreadCount = function(userId) {
  const unreadData = this.unreadCounts.find(u => u.user.toString() === userId.toString());
  if (unreadData) {
    unreadData.count += 1;
  } else {
    this.unreadCounts.push({ user: userId, count: 1 });
  }
  return this.save();
};

// Static method to find or create chat between users for a loan
chatSchema.statics.findOrCreateChat = async function(borrowerId, lenderId, loanId) {
  let chat = await this.findOne({
    participants: { $all: [borrowerId, lenderId] },
    loan: loanId,
    status: 'active'
  }).populate('participants', 'firstName lastName email userType');
  
  if (!chat) {
    chat = await this.create({
      participants: [borrowerId, lenderId],
      loan: loanId,
      unreadCounts: [
        { user: borrowerId, count: 0 },
        { user: lenderId, count: 0 }
      ]
    });
    
    // Populate the participants
    await chat.populate('participants', 'firstName lastName email userType');
  }
  
  return chat;
};

// Static method to find or create chat for a lending pool
chatSchema.statics.findOrCreatePoolChat = async function(borrowerId, lenderId, poolId) {
  console.log(`🔍 findOrCreatePoolChat called with: borrowerId=${borrowerId}, lenderId=${lenderId}, poolId=${poolId}`);
  
  // First, try to find existing chat between these two users for this pool
  let chat = await this.findOne({
    participants: { $all: [borrowerId, lenderId] },
    pool: poolId,
    status: 'active'
  }).populate('participants', 'firstName lastName email userType');
  
  console.log(`📊 Existing chat found:`, chat ? 'Yes' : 'No');
  
  if (!chat) {
    console.log(`💬 Creating new chat with participants: [${borrowerId}, ${lenderId}]`);
    
    // Create new chat with both participants
    chat = await this.create({
      participants: [borrowerId, lenderId],
      pool: poolId,
      chatType: 'pool_discussion',
      unreadCounts: [
        { user: borrowerId, count: 0 },
        { user: lenderId, count: 0 }
      ]
    });
    
    console.log(`✅ Chat created with ID: ${chat._id}`);
    
    // Populate the participants
    await chat.populate('participants', 'firstName lastName email userType');
    
    console.log(`👥 Chat participants:`, chat.participants?.map(p => `${p.firstName} ${p.lastName} (${p.userType})`));
  } else {
    console.log(`♻️ Using existing chat with ID: ${chat._id}`);
  }
  
  return chat;
};

// Static method to find or create admin chat
chatSchema.statics.findOrCreateAdminChat = async function(adminId, targetUserId, targetUserType) {
  console.log(`🔍 findOrCreateAdminChat called with: adminId=${adminId}, targetUserId=${targetUserId}, targetUserType=${targetUserType}`);
  
  // First, try to find existing admin chat between these two users
  let chat = await this.findOne({
    participants: { $all: [adminId, targetUserId] },
    chatType: 'admin_support',
    status: 'active'
  }).populate('participants', 'firstName lastName email userType');
  
  console.log(`📊 Existing admin chat found:`, chat ? 'Yes' : 'No');
  
  if (!chat) {
    console.log(`💬 Creating new admin chat with participants: [${adminId}, ${targetUserId}]`);
    
    // Create new admin chat with both participants
    chat = await this.create({
      participants: [adminId, targetUserId],
      chatType: 'admin_support',
      metadata: {
        initiatedBy: 'admin',
        targetUserType: targetUserType,
        purpose: `Admin support for ${targetUserType}`
      },
      unreadCounts: [
        { user: adminId, count: 0 },
        { user: targetUserId, count: 0 }
      ]
    });
    
    console.log(`✅ Admin chat created with ID: ${chat._id}`);
    
    // Populate the participants
    await chat.populate('participants', 'firstName lastName email userType');
    
    console.log(`👥 Admin chat participants:`, chat.participants?.map(p => `${p.firstName} ${p.lastName} (${p.userType})`));
  } else {
    console.log(`♻️ Using existing admin chat with ID: ${chat._id}`);
  }
  
  return chat;
};

module.exports = mongoose.model('Chat', chatSchema);
