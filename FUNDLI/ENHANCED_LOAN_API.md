# Enhanced Loan Application Management API

## Overview
This document outlines the complete API endpoints for the enhanced loan application management system with accept/reject functionality, payment processing, and automatic notifications.

## Complete Loan Flow

### 1. Lender Accepts Loan Application
```
POST /api/lender/loan/{loanId}/accept
Authorization: Bearer <lender_token>
Content-Type: application/json

{
  "investmentAmount": 5000,
  "notes": "Interested in supporting this business expansion"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application accepted successfully",
  "data": {
    "loanId": "loan_123",
    "status": "accepted",
    "nextStep": "payment_required"
  }
}
```

**Backend Actions:**
- Update loan status to "accepted"
- Create investment record
- Send notification to borrower about acceptance
- Send notification to admin about acceptance
- Return success with next step indicator

### 2. Lender Funds Accepted Loan
```
POST /api/lender/loan/{loanId}/fund
Authorization: Bearer <lender_token>
Content-Type: application/json

{
  "amount": 5000,
  "paymentMethod": "bank_transfer",
  "notes": "Funding for business expansion loan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan funded successfully",
  "data": {
    "loanId": "loan_123",
    "fundedAmount": 5000,
    "borrowerBalance": 5000,
    "transactionId": "txn_789",
    "status": "funded"
  }
}
```

**Backend Actions:**
- Validate lender has sufficient balance
- Process payment transaction
- Update borrower's available balance
- Update loan status to "funded"
- Create transaction record
- Send notification to borrower about funding
- Send notification to admin about funding
- Update lender's wallet balance

### 3. Lender Rejects Loan Application
```
POST /api/lender/loan/{loanId}/reject
Authorization: Bearer <lender_token>
Content-Type: application/json

{
  "reason": "Insufficient collateral or high risk profile"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application rejected successfully",
  "data": {
    "loanId": "loan_123",
    "status": "rejected",
    "reason": "Insufficient collateral or high risk profile"
  }
}
```

**Backend Actions:**
- Update loan status to "rejected"
- Remove loan from lender's pending list
- Send notification to borrower with rejection reason
- Send notification to admin about rejection
- Log rejection for analytics
- Delete loan application from database

## Lender Wallet Endpoints

### 4. Get Lender Wallet Balance
```
GET /api/lender/wallet/balance
Authorization: Bearer <lender_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 25000.00,
    "currency": "USD",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Get Lender Transaction History
```
GET /api/lender/wallet/transactions
Authorization: Bearer <lender_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_789",
        "type": "loan_funding",
        "amount": 5000,
        "description": "Funding for loan #loan_123",
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "loanId": "loan_123",
        "borrowerName": "John Doe"
      }
    ]
  }
}
```

## Borrower Balance Endpoints

### 6. Get Borrower Available Balance
```
GET /api/borrower/wallet/balance
Authorization: Bearer <borrower_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "availableBalance": 5000.00,
    "totalBorrowed": 10000.00,
    "totalRepaid": 5000.00,
    "currency": "USD",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### 7. Update Borrower Balance (Internal)
```
POST /api/borrower/wallet/update-balance
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "borrowerId": "user_456",
  "amount": 5000,
  "type": "loan_funding",
  "loanId": "loan_123",
  "description": "Loan funding from lender"
}
```

## Enhanced Notification System

### 8. Create Notification
```
POST /api/notifications/create
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "userId": "user_456",
  "type": "loan_funded",
  "title": "Loan Funded Successfully",
  "message": "Your loan application for $5,000 has been funded and the amount has been added to your account balance.",
  "metadata": {
    "loanId": "loan_123",
    "amount": 5000,
    "lenderName": "Jane Smith",
    "transactionId": "txn_789"
  }
}
```

### 9. Send Multiple Notifications
```
POST /api/notifications/bulk-create
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "notifications": [
    {
      "userId": "user_456",
      "type": "loan_funded",
      "title": "Loan Funded Successfully",
      "message": "Your loan application has been funded.",
      "metadata": {
        "loanId": "loan_123",
        "amount": 5000
      }
    },
    {
      "userId": "admin_001",
      "type": "loan_funded",
      "title": "Loan Funding Completed",
      "message": "A loan has been funded by lender Jane Smith.",
      "metadata": {
        "loanId": "loan_123",
        "amount": 5000,
        "lenderName": "Jane Smith"
      }
    }
  ]
}
```

## Database Schema Updates

### Enhanced Loan Applications Table
```sql
ALTER TABLE loan_applications 
ADD COLUMN rejection_reason TEXT,
ADD COLUMN rejected_by VARCHAR(255),
ADD COLUMN rejected_at TIMESTAMP NULL,
ADD COLUMN accepted_by VARCHAR(255),
ADD COLUMN accepted_at TIMESTAMP NULL,
ADD COLUMN funded_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN funded_at TIMESTAMP NULL,
ADD COLUMN transaction_id VARCHAR(255),
ADD COLUMN payment_method ENUM('bank_transfer', 'wallet', 'crypto') DEFAULT 'bank_transfer';
```

### Lender Wallet Table
```sql
CREATE TABLE lender_wallets (
  id VARCHAR(255) PRIMARY KEY,
  lender_id VARCHAR(255) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Borrower Wallet Table
```sql
CREATE TABLE borrower_wallets (
  id VARCHAR(255) PRIMARY KEY,
  borrower_id VARCHAR(255) NOT NULL,
  available_balance DECIMAL(15,2) DEFAULT 0,
  total_borrowed DECIMAL(15,2) DEFAULT 0,
  total_repaid DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id VARCHAR(255) PRIMARY KEY,
  lender_id VARCHAR(255) NOT NULL,
  borrower_id VARCHAR(255) NOT NULL,
  loan_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('loan_funding', 'repayment', 'refund') NOT NULL,
  payment_method ENUM('bank_transfer', 'wallet', 'crypto') NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id) ON DELETE CASCADE
);
```

## Notification Types

### Loan Funded Notification
- **Type:** `loan_funded`
- **Trigger:** When lender completes funding
- **Recipients:** Borrower, Admin
- **Metadata:** 
  - `loanId`: ID of the funded loan
  - `amount`: Funded amount
  - `lenderName`: Name of the lender
  - `transactionId`: Transaction ID
  - `borrowerBalance`: Updated borrower balance

### Loan Rejected Notification
- **Type:** `loan_rejected`
- **Trigger:** When lender rejects loan
- **Recipients:** Borrower, Admin
- **Metadata:**
  - `loanId`: ID of the rejected loan
  - `lenderName`: Name of the lender who rejected
  - `reason`: Rejection reason
  - `amount`: Rejected loan amount

### Loan Accepted Notification
- **Type:** `loan_accepted`
- **Trigger:** When lender accepts loan (before funding)
- **Recipients:** Borrower, Admin
- **Metadata:**
  - `loanId`: ID of the accepted loan
  - `lenderName`: Name of the lender
  - `amount`: Accepted loan amount
  - `nextStep`: "payment_required"

## Implementation Flow

### Complete Loan Acceptance Flow:
1. **Lender clicks "Accept"** → Opens accept modal
2. **Lender fills investment details** → Clicks "Accept & Fund Loan"
3. **Backend accepts loan** → Updates status to "accepted"
4. **Frontend opens payment modal** → Shows funding interface
5. **Lender enters payment details** → Clicks "Fund Loan"
6. **Backend processes payment** → Updates balances
7. **Notifications sent** → Borrower and admin notified
8. **Loan status updated** → Status becomes "funded"

### Complete Loan Rejection Flow:
1. **Lender clicks "Reject"** → Opens reject modal
2. **Lender enters rejection reason** → Clicks "Reject Loan"
3. **Backend rejects loan** → Updates status to "rejected"
4. **Loan deleted from pending** → Removed from lender's list
5. **Notifications sent** → Borrower and admin notified
6. **Loan removed from database** → Cleanup completed

## Security & Validation

### Payment Validation:
- Verify lender has sufficient balance
- Validate payment amount doesn't exceed loan amount
- Ensure loan is in "accepted" status
- Validate payment method is supported

### Notification Security:
- Sanitize all notification content
- Validate user permissions
- Rate limit notification creation
- Encrypt sensitive metadata

### Transaction Security:
- Log all financial transactions
- Implement transaction rollback on failure
- Validate transaction integrity
- Monitor for suspicious activity

## Testing Endpoints

### Test Complete Acceptance Flow:
```bash
# 1. Accept loan
curl -X POST https://fundli-hjqn.vercel.app/api/lender/loan/loan_123/accept \
  -H "Authorization: Bearer <lender_token>" \
  -H "Content-Type: application/json" \
  -d '{"investmentAmount": 5000, "notes": "Great business plan"}'

# 2. Fund loan
curl -X POST https://fundli-hjqn.vercel.app/api/lender/loan/loan_123/fund \
  -H "Authorization: Bearer <lender_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "paymentMethod": "bank_transfer", "notes": "Funding completed"}'
```

### Test Rejection Flow:
```bash
curl -X POST https://fundli-hjqn.vercel.app/api/lender/loan/loan_123/reject \
  -H "Authorization: Bearer <lender_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Insufficient credit history"}'
```

This enhanced API documentation provides the complete backend implementation needed for the full loan application management system with payment processing and automatic notifications.
