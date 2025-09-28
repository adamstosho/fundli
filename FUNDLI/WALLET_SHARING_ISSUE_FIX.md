# Wallet Balance Sharing Issue - Root Cause & Solution

## 🚨 **THE PROBLEM**

All users (lender, admin, borrower) are showing the same wallet balance because:

1. **Same API Endpoint**: All users call `/api/wallet` regardless of user type
2. **No User Differentiation**: Backend doesn't separate wallets by user type
3. **Shared Wallet Data**: All users get the same wallet response

## 🔍 **ROOT CAUSE ANALYSIS**

### Frontend Issue:
```javascript
// ALL users call the same endpoint
const response = await fetch('https://fundli-hjqn.vercel.app/api/wallet', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Backend Issue (Likely):
```javascript
// Backend probably does something like this:
app.get('/api/wallet', (req, res) => {
  // Returns the same wallet for everyone
  res.json({ data: { wallet: { balance: 10000 } } });
});
```

## ✅ **FRONTEND FIX IMPLEMENTED**

I've updated the frontend to use user-type-specific endpoints:

### Updated WalletBalanceCard.jsx:
```javascript
// Now uses different endpoints based on user type
if (currentUserType === 'lender') {
  apiEndpoint = 'https://fundli-hjqn.vercel.app/api/lender/wallet/balance';
} else if (currentUserType === 'borrower') {
  apiEndpoint = 'https://fundli-hjqn.vercel.app/api/borrower/wallet/balance';
} else if (currentUserType === 'admin') {
  apiEndpoint = 'https://fundli-hjqn.vercel.app/api/admin/wallet/balance';
}
```

### Updated PaymentModal.jsx:
```javascript
// Added logging to debug wallet balance loading
console.log('PaymentModal - Loading wallet balance for user type:', userInfo.userType);
console.log('PaymentModal - Wallet balance response:', result);
```

## 🛠 **BACKEND IMPLEMENTATION REQUIRED**

You need to implement these endpoints on your backend:

### 1. Lender Wallet Endpoints
```javascript
// GET /api/lender/wallet/balance
app.get('/api/lender/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    const wallet = await Wallet.findOne({ userId, userType: 'lender' });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Lender wallet not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        userType: 'lender'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lender wallet balance'
    });
  }
});

// POST /api/lender/wallet/create
app.post('/api/lender/wallet/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ userId, userType: 'lender' });
    if (existingWallet) {
      return res.json({
        success: true,
        data: { wallet: existingWallet }
      });
    }
    
    // Create new lender wallet
    const wallet = new Wallet({
      userId,
      userType: 'lender',
      balance: 0,
      currency: 'USD',
      status: 'active'
    });
    
    await wallet.save();
    
    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create lender wallet'
    });
  }
});
```

### 2. Borrower Wallet Endpoints
```javascript
// GET /api/borrower/wallet/balance
app.get('/api/borrower/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ userId, userType: 'borrower' });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Borrower wallet not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        userType: 'borrower'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrower wallet balance'
    });
  }
});

// POST /api/borrower/wallet/create
app.post('/api/borrower/wallet/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const existingWallet = await Wallet.findOne({ userId, userType: 'borrower' });
    if (existingWallet) {
      return res.json({
        success: true,
        data: { wallet: existingWallet }
      });
    }
    
    const wallet = new Wallet({
      userId,
      userType: 'borrower',
      balance: 0,
      currency: 'USD',
      status: 'active'
    });
    
    await wallet.save();
    
    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create borrower wallet'
    });
  }
});
```

### 3. Admin Wallet Endpoints
```javascript
// GET /api/admin/wallet/balance
app.get('/api/admin/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ userId, userType: 'admin' });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Admin wallet not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        userType: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin wallet balance'
    });
  }
});

// POST /api/admin/wallet/create
app.post('/api/admin/wallet/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const existingWallet = await Wallet.findOne({ userId, userType: 'admin' });
    if (existingWallet) {
      return res.json({
        success: true,
        data: { wallet: existingWallet }
      });
    }
    
    const wallet = new Wallet({
      userId,
      userType: 'admin',
      balance: 0,
      currency: 'USD',
      status: 'active'
    });
    
    await wallet.save();
    
    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin wallet'
    });
  }
});
```

## 🗄 **UPDATED DATABASE SCHEMA**

Your Wallet model should include `userType`:

```javascript
const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['lender', 'borrower', 'admin'],
    required: true
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
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add compound index for user + userType
walletSchema.index({ userId: 1, userType: 1 }, { unique: true });
```

## 🔧 **IMMEDIATE TESTING STEPS**

### 1. Check Browser Console
Open browser dev tools and look for these logs:
```
Loading wallet for user type: lender
Using API endpoint: https://fundli-hjqn.vercel.app/api/lender/wallet/balance
PaymentModal - Loading wallet balance for user type: lender
PaymentModal - Wallet balance response: {...}
```

### 2. Test Different User Types
1. **Login as Lender** → Should call `/api/lender/wallet/balance`
2. **Login as Borrower** → Should call `/api/borrower/wallet/balance`
3. **Login as Admin** → Should call `/api/admin/wallet/balance`

### 3. Check Network Tab
In browser dev tools → Network tab:
- Look for the correct API endpoints being called
- Check response data for different balances

## 🚀 **EXPECTED RESULTS AFTER BACKEND IMPLEMENTATION**

### Before Fix:
- ❌ All users show same balance (e.g., $10,000)
- ❌ Lender funds loan → All users see same balance change
- ❌ No wallet separation

### After Fix:
- ✅ Lender shows lender balance (e.g., $5,000)
- ✅ Borrower shows borrower balance (e.g., $2,000)
- ✅ Admin shows admin balance (e.g., $0)
- ✅ When lender funds loan → Only lender balance decreases
- ✅ When borrower receives funds → Only borrower balance increases
- ✅ Complete wallet isolation

## 📋 **IMPLEMENTATION CHECKLIST**

### Frontend (✅ Complete):
- [x] Updated WalletBalanceCard to use user-type-specific endpoints
- [x] Added logging for debugging
- [x] Updated PaymentModal with better error handling
- [x] Added user type detection from localStorage

### Backend (📋 To Implement):
- [ ] Create `/api/lender/wallet/balance` endpoint
- [ ] Create `/api/borrower/wallet/balance` endpoint
- [ ] Create `/api/admin/wallet/balance` endpoint
- [ ] Create wallet creation endpoints for each user type
- [ ] Update Wallet model to include `userType` field
- [ ] Add compound index for userId + userType
- [ ] Test with different user types

## 🎯 **QUICK DEBUG COMMANDS**

### Check Current User Type:
```javascript
// In browser console
console.log('User Info:', JSON.parse(localStorage.getItem('userInfo')));
console.log('User Type:', JSON.parse(localStorage.getItem('userInfo')).userType);
```

### Check API Calls:
```javascript
// In browser console - Network tab
// Look for calls to:
// - /api/lender/wallet/balance (for lenders)
// - /api/borrower/wallet/balance (for borrowers)
// - /api/admin/wallet/balance (for admins)
```

The frontend is now fixed and will call the correct endpoints. You just need to implement the backend endpoints to complete the wallet separation! 🎉
