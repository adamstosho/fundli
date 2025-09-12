// Simple test to check the loan acceptance endpoint
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import models
const User = require('./src/models/User');
const Loan = require('./src/models/Loan');
const Wallet = require('./src/models/Wallet');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to database
mongoose.connect('mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Test endpoint
app.post('/test-loan-accept/:id', async (req, res) => {
  try {
    console.log('Testing loan acceptance for ID:', req.params.id);
    
    const { investmentAmount, notes } = req.body;
    console.log('Investment amount:', investmentAmount);
    
    // Get loan details
    const loan = await Loan.findById(req.params.id).populate('borrower', 'firstName lastName email');
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan application not found'
      });
    }
    
    console.log('Loan found:', {
      id: loan._id,
      borrower: loan.borrower,
      status: loan.status,
      amount: loan.loanAmount
    });
    
    // Check if loan is still available
    if (loan.status !== 'pending' && loan.status !== 'kyc_pending') {
      return res.status(400).json({
        status: 'error',
        message: 'This loan is no longer available for funding'
      });
    }
    
    // Get lender wallet (using first lender for testing)
    const lenders = await User.find({ userType: 'lender' });
    if (lenders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No lenders found'
      });
    }
    
    const lenderWallet = await Wallet.findOne({ user: lenders[0]._id });
    if (!lenderWallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Lender wallet not found'
      });
    }
    
    // Get borrower wallet
    const borrowerWallet = await Wallet.findOne({ user: loan.borrower._id });
    if (!borrowerWallet) {
      return res.status(404).json({
        status: 'error',
        message: 'Borrower wallet not found'
      });
    }
    
    console.log('All checks passed - loan acceptance should work');
    
    res.json({
      status: 'success',
      message: 'All checks passed',
      data: {
        loan: {
          id: loan._id,
          status: loan.status,
          amount: loan.loanAmount
        },
        lender: {
          id: lenders[0]._id,
          balance: lenderWallet.balance
        },
        borrower: {
          id: loan.borrower._id,
          balance: borrowerWallet.balance
        }
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});