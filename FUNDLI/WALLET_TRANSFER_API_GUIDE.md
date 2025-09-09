# Wallet Transfer API Implementation Guide

## Overview
This document provides the specific API endpoints that need to be implemented on the backend to support wallet balance transfers when lenders fund loan applications.

## Required Wallet Transfer Endpoints

### 1. Wallet Transfer (Primary Endpoint)
```
POST /api/wallet/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromUserId": "lender_123",
  "toUserId": "borrower_456",
  "amount": 5000,
  "type": "loan_funding",
  "description": "Loan funding for business expansion",
  "loanId": "loan_789",
  "transactionId": "txn_101"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet transfer completed successfully",
  "data": {
    "transferId": "transfer_202",
    "fromUserBalance": 5000,
    "toUserBalance": 10000,
    "amount": 5000,
    "transferFee": 0,
    "netAmount": 5000,
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "completed"
  }
}
```

### 2. Get Wallet Balance
```
GET /api/wallet/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 10000.50,
    "currency": "USD",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Get Transaction History
```
GET /api/wallet/transactions
Authorization: Bearer <token>
Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- type: string (optional: 'loan_funding', 'loan_repayment', 'deposit', 'withdrawal')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_101",
        "type": "loan_funding",
        "amount": 5000,
        "description": "Loan funding for business expansion",
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "metadata": {
          "loanId": "loan_789",
          "borrowerId": "borrower_456",
          "transferId": "transfer_202"
        }
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### 4. Rollback Transaction (Error Recovery)
```
POST /api/wallet/rollback
Authorization: Bearer <token>
Content-Type: application/json

{
  "transferId": "transfer_202",
  "reason": "Wallet transfer failed",
  "originalTransactionId": "txn_101"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction rolled back successfully",
  "data": {
    "rollbackId": "rollback_303",
    "fromUserBalance": 10000,
    "toUserBalance": 5000,
    "amount": 5000,
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

## Database Schema

### Wallets Table
```sql
CREATE TABLE wallets (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_wallet (user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_balance (balance)
);
```

### Wallet Transactions Table
```sql
CREATE TABLE wallet_transactions (
  id VARCHAR(255) PRIMARY KEY,
  wallet_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  transfer_id VARCHAR(255),
  type ENUM('loan_funding', 'loan_repayment', 'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'refund') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  status ENUM('pending', 'completed', 'failed', 'cancelled', 'rolled_back') DEFAULT 'pending',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_transfer_id (transfer_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Wallet Transfers Table
```sql
CREATE TABLE wallet_transfers (
  id VARCHAR(255) PRIMARY KEY,
  from_user_id VARCHAR(255) NOT NULL,
  to_user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transfer_fee DECIMAL(15,2) DEFAULT 0.00,
  net_amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  loan_id VARCHAR(255),
  transaction_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'cancelled', 'rolled_back') DEFAULT 'pending',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_from_user (from_user_id),
  INDEX idx_to_user (to_user_id),
  INDEX idx_loan_id (loan_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

## Backend Implementation Examples

### Node.js/Express Implementation

```javascript
// Wallet Transfer Endpoint
app.post('/api/wallet/transfer', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { fromUserId, toUserId, amount, type, description, loanId, transactionId } = req.body;
    
    // Validate required fields
    if (!fromUserId || !toUserId || !amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer parameters'
      });
    }
    
    // Get wallets
    const fromWallet = await Wallet.findOne({ userId: fromUserId }).session(session);
    const toWallet = await Wallet.findOne({ userId: toUserId }).session(session);
    
    if (!fromWallet || !toWallet) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'One or both wallets not found'
      });
    }
    
    // Check sufficient balance
    if (fromWallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for transfer'
      });
    }
    
    // Calculate transfer fee (if applicable)
    const transferFee = calculateTransferFee(amount, type);
    const netAmount = amount - transferFee;
    
    // Create transfer record
    const transferId = generateId();
    const transfer = new WalletTransfer({
      id: transferId,
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
      id: generateId(),
      walletId: fromWallet.id,
      transactionId,
      transferId,
      type: 'transfer_out',
      amount: -amount,
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromWallet.balance,
      description: `Transfer to ${toUserId}: ${description}`,
      status: 'completed',
      metadata: { loanId, toUserId }
    });
    
    const toTransaction = new WalletTransaction({
      id: generateId(),
      walletId: toWallet.id,
      transactionId,
      transferId,
      type: 'transfer_in',
      amount: netAmount,
      balanceBefore: toBalanceBefore,
      balanceAfter: toWallet.balance,
      description: `Transfer from ${fromUserId}: ${description}`,
      status: 'completed',
      metadata: { loanId, fromUserId }
    });
    
    await fromTransaction.save({ session });
    await toTransaction.save({ session });
    
    // Update transfer status
    transfer.status = 'completed';
    await transfer.save({ session });
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Wallet transfer completed successfully',
      data: {
        transferId,
        fromUserBalance: fromWallet.balance,
        toUserBalance: toWallet.balance,
        amount,
        transferFee,
        netAmount,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing wallet transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process wallet transfer'
    });
  } finally {
    session.endSession();
  }
});

// Get Wallet Balance
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
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

// Rollback Transaction
app.post('/api/wallet/rollback', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { transferId, reason, originalTransactionId } = req.body;
    
    // Find the original transfer
    const transfer = await WalletTransfer.findOne({ id: transferId }).session(session);
    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    if (transfer.status !== 'completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Transfer cannot be rolled back'
      });
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
    const rollbackId = generateId();
    
    const fromRollback = new WalletTransaction({
      id: generateId(),
      walletId: fromWallet.id,
      transactionId: rollbackId,
      transferId,
      type: 'refund',
      amount: transfer.amount,
      balanceBefore: fromWallet.balance - transfer.amount,
      balanceAfter: fromWallet.balance,
      description: `Rollback: ${reason}`,
      status: 'completed',
      metadata: { originalTransactionId, reason }
    });
    
    const toRollback = new WalletTransaction({
      id: generateId(),
      walletId: toWallet.id,
      transactionId: rollbackId,
      transferId,
      type: 'refund',
      amount: -transfer.netAmount,
      balanceBefore: toWallet.balance + transfer.netAmount,
      balanceAfter: toWallet.balance,
      description: `Rollback: ${reason}`,
      status: 'completed',
      metadata: { originalTransactionId, reason }
    });
    
    await fromRollback.save({ session });
    await toRollback.save({ session });
    
    // Update transfer status
    transfer.status = 'rolled_back';
    await transfer.save({ session });
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Transaction rolled back successfully',
      data: {
        rollbackId,
        fromUserBalance: fromWallet.balance,
        toUserBalance: toWallet.balance,
        amount: transfer.amount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error rolling back transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback transaction'
    });
  } finally {
    session.endSession();
  }
});

// Helper function to calculate transfer fees
function calculateTransferFee(amount, type) {
  switch (type) {
    case 'loan_funding':
      return 0; // No fee for loan funding
    case 'loan_repayment':
      return amount * 0.01; // 1% fee for repayments
    default:
      return amount * 0.005; // 0.5% fee for other transfers
  }
}
```

## Integration with Loan Funding Flow

### Complete Loan Funding Process
```javascript
// Enhanced loan funding endpoint
app.post('/api/lender/loan/:loanId/fund', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { loanId } = req.params;
    const { amount, paymentMethod, notes, borrowerId } = req.body;
    const lenderId = req.user.id;
    
    // Step 1: Validate loan application
    const loan = await Loan.findById(loanId).session(session);
    if (!loan || loan.status !== 'accepted_by_lender') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Loan application not found or not in correct status'
      });
    }
    
    // Step 2: Process loan funding
    loan.status = 'funded';
    loan.fundedAmount = amount;
    loan.fundedAt = new Date();
    loan.fundedBy = lenderId;
    
    await loan.save({ session });
    
    // Step 3: Create transaction record
    const transactionId = generateId();
    const transaction = new Transaction({
      id: transactionId,
      loanId,
      lenderId,
      borrowerId,
      amount,
      type: 'loan_funding',
      status: 'completed',
      metadata: { paymentMethod, notes }
    });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Loan funded successfully',
      data: {
        loanId,
        transactionId,
        amount,
        status: 'funded',
        fundedAt: loan.fundedAt
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error funding loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fund loan'
    });
  } finally {
    session.endSession();
  }
});
```

## Security Considerations

1. **Transaction Atomicity**: Use database transactions to ensure wallet updates are atomic
2. **Balance Validation**: Always check sufficient balance before processing transfers
3. **Authorization**: Verify users can only transfer from their own wallets
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Audit Logging**: Log all wallet transactions for security monitoring
6. **Input Validation**: Validate all input parameters and amounts
7. **Rollback Capability**: Implement rollback functionality for failed operations

## Testing the Wallet Transfer System

### Test Wallet Transfer
```bash
# Test successful transfer
curl -X POST http://localhost:5000/api/wallet/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": "lender_123",
    "toUserId": "borrower_456",
    "amount": 5000,
    "type": "loan_funding",
    "description": "Loan funding for business expansion",
    "loanId": "loan_789",
    "transactionId": "txn_101"
  }'

# Test insufficient balance
curl -X POST http://localhost:5000/api/wallet/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": "lender_123",
    "toUserId": "borrower_456",
    "amount": 50000,
    "type": "loan_funding",
    "description": "Loan funding test"
  }'
```

### Test Wallet Balance
```bash
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer <token>"
```

This implementation guide provides everything needed to implement the wallet transfer system on the backend, ensuring proper balance management and transaction integrity.
