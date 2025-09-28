# Quick Backend Setup Script

## Step-by-Step Implementation

### 1. Install Required Dependencies
```bash
npm install mongoose express cors jsonwebtoken bcryptjs
```

### 2. Create Database Models
Create these files in your backend:

**models/Wallet.js** - Copy the wallet model from the implementation guide
**models/WalletTransaction.js** - Copy the transaction model
**models/WalletTransfer.js** - Copy the transfer model  
**models/Notification.js** - Copy the notification model

### 3. Create Services
Create these files:

**services/walletService.js** - Copy the wallet service
**services/notificationService.js** - Copy the notification service

### 4. Create Routes
Create these files:

**routes/lender.js** - Copy the fixed lender routes
**routes/notifications.js** - Copy the notification routes
**routes/wallet.js** - Copy the wallet routes

### 5. Update Your Main App File
Add these routes to your main app.js or server.js:

```javascript
app.use('/api/lender', require('./routes/lender'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/wallet', require('./routes/wallet'));
```

### 6. Test the Implementation

**Test Loan Funding:**
```bash
curl -X POST https://fundli-hjqn.vercel.app/api/lender/loan/{loanId}/fund \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "wallet",
    "notes": "Business expansion funding",
    "borrowerId": "borrower_id_here"
  }'
```

**Test Wallet Balance:**
```bash
curl -X GET https://fundli-hjqn.vercel.app/api/lender/wallet/balance \
  -H "Authorization: Bearer <token>"
```

**Test Notifications:**
```bash
curl -X GET https://fundli-hjqn.vercel.app/api/notifications \
  -H "Authorization: Bearer <token>"
```

## Key Changes Made

1. **Fixed Wallet Transfer**: Money now properly transfers between wallets
2. **Fixed Balance Updates**: Money goes to wallet balance, not total borrowed
3. **Added Notifications**: Borrower and admin receive notifications
4. **Added Transaction Integrity**: Database transactions ensure consistency
5. **Added Error Handling**: Proper rollback on failures

## Expected Results After Implementation

✅ **Lender wallet balance decreases** by the funded amount
✅ **Borrower wallet balance increases** by the funded amount  
✅ **Borrower receives notification** about the funding
✅ **Admin receives notification** about the funding
✅ **Money goes to wallet balance** not total borrowed
✅ **Transaction records created** for audit trail

This implementation will fix all the issues you mentioned!
