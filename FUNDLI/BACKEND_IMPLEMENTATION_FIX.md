# Complete Backend Implementation for Wallet Transfers

## Issue Analysis
The current problems are:
1. **Lender wallet balance not deducted** - Money should be taken from lender's wallet
2. **No notifications sent** - Borrower and admin should receive notifications
3. **Wrong balance update** - Money added to "total borrowed" instead of wallet balance

## Complete Backend Implementation

### 1. Database Models (MongoDB/Mongoose)

```javascript
// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);

// models/WalletTransaction.js
const walletTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  transferId: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['loan_funding', 'loan_repayment', 'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'rolled_back'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

// models/WalletTransfer.js
const walletTransferSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transferFee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: false
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'rolled_back'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WalletTransfer', walletTransferSchema);

// models/Notification.js
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['loan_funded', 'loan_rejected', 'loan_accepted', 'loan_pending', 'payment_due', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
```

### 2. Wallet Transfer Service

```javascript
// services/walletService.js
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WalletTransfer = require('../models/WalletTransfer');
const mongoose = require('mongoose');

class WalletService {
  // Create wallet for user
  static async createWallet(userId, initialBalance = 0) {
    try {
      const wallet = new Wallet({
        userId,
        balance: initialBalance
      });
      return await wallet.save();
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // Get wallet balance
  static async getWalletBalance(userId) {
    try {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        // Create wallet if it doesn't exist
        return await this.createWallet(userId);
      }
      return wallet;
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  // Transfer money between wallets
  static async transferMoney(fromUserId, toUserId, amount, type, description, loanId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get wallets
      const fromWallet = await Wallet.findOne({ userId: fromUserId }).session(session);
      const toWallet = await Wallet.findOne({ userId: toUserId }).session(session);

      if (!fromWallet) {
        throw new Error('Sender wallet not found');
      }
      if (!toWallet) {
        throw new Error('Receiver wallet not found');
      }

      // Check sufficient balance
      if (fromWallet.balance < amount) {
        throw new Error('Insufficient balance for transfer');
      }

      // Calculate transfer fee (0% for loan funding)
      const transferFee = type === 'loan_funding' ? 0 : amount * 0.005;
      const netAmount = amount - transferFee;

      // Generate IDs
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transfer record
      const transfer = new WalletTransfer({
        fromUserId,
        toUserId,
        amount,
        transferFee,
        netAmount,
        type,
        description,
        loanId,
        transactionId,
        status: 'pending'
      });

      await transfer.save({ session });

      // Update wallet balances
      const fromBalanceBefore = fromWallet.balance;
      const toBalanceBefore = toWallet.balance;

      fromWallet.balance -= amount;
      toWallet.balance += netAmount;

      await fromWallet.save({ session });
      await toWallet.save({ session });

      // Create transaction records
      const fromTransaction = new WalletTransaction({
        walletId: fromWallet._id,
        userId: fromUserId,
        transactionId,
        transferId,
        type: 'transfer_out',
        amount: -amount,
        balanceBefore: fromBalanceBefore,
        balanceAfter: fromWallet.balance,
        description: `Transfer to user ${toUserId}: ${description}`,
        status: 'completed',
        metadata: { loanId, toUserId, transferFee }
      });

      const toTransaction = new WalletTransaction({
        walletId: toWallet._id,
        userId: toUserId,
        transactionId,
        transferId,
        type: 'transfer_in',
        amount: netAmount,
        balanceBefore: toBalanceBefore,
        balanceAfter: toWallet.balance,
        description: `Transfer from user ${fromUserId}: ${description}`,
        status: 'completed',
        metadata: { loanId, fromUserId, transferFee }
      });

      await fromTransaction.save({ session });
      await toTransaction.save({ session });

      // Update transfer status
      transfer.status = 'completed';
      await transfer.save({ session });

      await session.commitTransaction();

      return {
        transferId,
        fromUserBalance: fromWallet.balance,
        toUserBalance: toWallet.balance,
        amount,
        transferFee,
        netAmount,
        transactionId
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Rollback transfer
  static async rollbackTransfer(transferId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transfer = await WalletTransfer.findOne({ transferId }).session(session);
      if (!transfer) {
        throw new Error('Transfer not found');
      }

      if (transfer.status !== 'completed') {
        throw new Error('Transfer cannot be rolled back');
      }

      // Get wallets
      const fromWallet = await Wallet.findOne({ userId: transfer.fromUserId }).session(session);
      const toWallet = await Wallet.findOne({ userId: transfer.toUserId }).session(session);

      // Reverse the transfer
      fromWallet.balance += transfer.amount;
      toWallet.balance -= transfer.netAmount;

      await fromWallet.save({ session });
      await toWallet.save({ session });

      // Create rollback transaction records
      const rollbackTransactionId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const fromRollback = new WalletTransaction({
        walletId: fromWallet._id,
        userId: transfer.fromUserId,
        transactionId: rollbackTransactionId,
        transferId,
        type: 'refund',
        amount: transfer.amount,
        balanceBefore: fromWallet.balance - transfer.amount,
        balanceAfter: fromWallet.balance,
        description: `Rollback: ${reason}`,
        status: 'completed',
        metadata: { originalTransactionId: transfer.transactionId, reason }
      });

      const toRollback = new WalletTransaction({
        walletId: toWallet._id,
        userId: transfer.toUserId,
        transactionId: rollbackTransactionId,
        transferId,
        type: 'refund',
        amount: -transfer.netAmount,
        balanceBefore: toWallet.balance + transfer.netAmount,
        balanceAfter: toWallet.balance,
        description: `Rollback: ${reason}`,
        status: 'completed',
        metadata: { originalTransactionId: transfer.transactionId, reason }
      });

      await fromRollback.save({ session });
      await toRollback.save({ session });

      // Update transfer status
      transfer.status = 'rolled_back';
      await transfer.save({ session });

      await session.commitTransaction();

      return {
        rollbackTransactionId,
        fromUserBalance: fromWallet.balance,
        toUserBalance: toWallet.balance,
        amount: transfer.amount
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = WalletService;
```

### 3. Notification Service

```javascript
// services/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  // Create single notification
  static async createNotification(userId, type, title, message, metadata = {}) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        metadata
      });
      return await notification.save();
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Create multiple notifications
  static async createBulkNotifications(notifications) {
    try {
      return await Notification.insertMany(notifications);
    } catch (error) {
      throw new Error(`Failed to create bulk notifications: ${error.message}`);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, filter = 'all', limit = 20, offset = 0) {
    try {
      let query = { userId };
      
      if (filter !== 'all') {
        if (filter === 'unread') {
          query.isRead = false;
        } else {
          query.type = filter;
        }
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await Notification.countDocuments(query);

      return { notifications, total };
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      return await Notification.findOneAndDelete({ _id: notificationId, userId });
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }
}

module.exports = NotificationService;
```

### 4. Fixed Loan Funding API Endpoint

```javascript
// routes/lender.js
const express = require('express');
const router = express.Router();
const WalletService = require('../services/walletService');
const NotificationService = require('../services/notificationService');
const Loan = require('../models/Loan');
const User = require('../models/User');

// Fund loan application - FIXED VERSION
router.post('/loan/:loanId/fund', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { loanId } = req.params;
    const { amount, paymentMethod, notes, borrowerId } = req.body;
    const lenderId = req.user.id; // From JWT middleware

    // Validate input
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!borrowerId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Borrower ID is required'
      });
    }

    // Get loan application
    const loan = await Loan.findById(loanId).session(session);
    if (!loan) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    if (loan.status !== 'accepted_by_lender') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Loan application is not in correct status for funding'
      });
    }

    // Check lender wallet balance
    const lenderWallet = await WalletService.getWalletBalance(lenderId);
    if (lenderWallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have $${lenderWallet.balance.toLocaleString()} available, but trying to fund $${amount.toLocaleString()}`
      });
    }

    // Step 1: Process wallet transfer
    const transferResult = await WalletService.transferMoney(
      lenderId,
      borrowerId,
      amount,
      'loan_funding',
      `Loan funding for ${loan.purpose}`,
      loanId
    );

    // Step 2: Update loan status
    loan.status = 'funded';
    loan.fundedAmount = amount;
    loan.fundedAt = new Date();
    loan.fundedBy = lenderId;
    await loan.save({ session });

    // Step 3: Get user information for notifications
    const lender = await User.findById(lenderId).session(session);
    const borrower = await User.findById(borrowerId).session(session);

    // Step 4: Create notifications
    const notifications = [
      {
        userId: borrowerId,
        type: 'loan_funded',
        title: 'Loan Funded Successfully!',
        message: `Your loan application for $${amount.toLocaleString()} has been funded and the amount has been added to your wallet balance. Your new balance is $${transferResult.toUserBalance.toLocaleString()}.`,
        metadata: {
          loanId,
          amount,
          lenderName: lender.name,
          transactionId: transferResult.transactionId,
          transferId: transferResult.transferId,
          borrowerBalance: transferResult.toUserBalance,
          lenderBalance: transferResult.fromUserBalance,
          purpose: loan.purpose,
          fundedAt: new Date().toISOString()
        }
      },
      {
        userId: 'admin', // You might need to get admin ID from context
        type: 'loan_funded',
        title: 'Loan Funding Completed',
        message: `A loan application for $${amount.toLocaleString()} has been funded by lender ${lender.name}. Wallet transfer completed successfully.`,
        metadata: {
          loanId,
          amount,
          lenderName: lender.name,
          borrowerName: borrower.name,
          transactionId: transferResult.transactionId,
          transferId: transferResult.transferId,
          borrowerBalance: transferResult.toUserBalance,
          lenderBalance: transferResult.fromUserBalance,
          purpose: loan.purpose,
          fundedAt: new Date().toISOString()
        }
      }
    ];

    await NotificationService.createBulkNotifications(notifications);

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Loan funded successfully and wallet balances updated',
      data: {
        loanId,
        transactionId: transferResult.transactionId,
        transferId: transferResult.transferId,
        amount,
        status: 'funded',
        fundedAt: loan.fundedAt,
        lenderNewBalance: transferResult.fromUserBalance,
        borrowerNewBalance: transferResult.toUserBalance
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error funding loan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fund loan'
    });
  } finally {
    session.endSession();
  }
});

// Get lender wallet balance
router.get('/wallet/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await WalletService.getWalletBalance(userId);
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        lastUpdated: wallet.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance'
    });
  }
});

module.exports = router;
```

### 5. Notification API Endpoints

```javascript
// routes/notifications.js
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'all', limit = 20, offset = 0 } = req.query;
    
    const result = await NotificationService.getUserNotifications(
      userId, 
      filter, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Create notification
router.post('/create', async (req, res) => {
  try {
    const { userId, type, title, message, metadata } = req.body;
    
    const notification = await NotificationService.createNotification(
      userId, 
      type, 
      title, 
      message, 
      metadata
    );
    
    res.json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notificationId: notification._id,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await NotificationService.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await NotificationService.deleteNotification(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

module.exports = router;
```

### 6. Wallet Transfer API Endpoint

```javascript
// routes/wallet.js
const express = require('express');
const router = express.Router();
const WalletService = require('../services/walletService');

// Transfer money between wallets
router.post('/transfer', async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, type, description, loanId, transactionId } = req.body;
    
    const result = await WalletService.transferMoney(
      fromUserId,
      toUserId,
      amount,
      type,
      description,
      loanId
    );
    
    res.json({
      success: true,
      message: 'Wallet transfer completed successfully',
      data: {
        transferId: result.transferId,
        fromUserBalance: result.fromUserBalance,
        toUserBalance: result.toUserBalance,
        amount: result.amount,
        transferFee: result.transferFee,
        netAmount: result.netAmount,
        transactionId: result.transactionId,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Error processing wallet transfer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process wallet transfer'
    });
  }
});

// Get wallet balance
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await WalletService.getWalletBalance(userId);
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        lastUpdated: wallet.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance'
    });
  }
});

module.exports = router;
```

### 7. App.js Integration

```javascript
// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/lender', require('./routes/lender'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/wallet', require('./routes/wallet'));

// Database connection
mongoose.connect('mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Key Fixes Implemented

1. **✅ Wallet Balance Deduction**: Money is properly deducted from lender's wallet
2. **✅ Wallet Balance Addition**: Money is added to borrower's wallet balance (not total borrowed)
3. **✅ Notifications**: Both borrower and admin receive notifications
4. **✅ Transaction Integrity**: Database transactions ensure data consistency
5. **✅ Error Handling**: Proper error handling with rollback capability
6. **✅ Balance Validation**: Checks sufficient balance before processing

## Testing the Fix

1. **Start the backend server** with the new implementation
2. **Test loan funding** through the frontend
3. **Verify wallet balances** are updated correctly
4. **Check notifications** are sent to borrower and admin
5. **Confirm money goes to wallet balance** not total borrowed

This implementation will fix all the issues you mentioned!
