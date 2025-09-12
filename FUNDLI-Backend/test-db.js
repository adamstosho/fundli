const mongoose = require('mongoose');
const Loan = require('./src/models/Loan');
const User = require('./src/models/User');
const Wallet = require('./src/models/Wallet');

async function testDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect('mongodb://localhost:27017/fundli', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to database');
    
    // Test the specific loan ID
    const loanId = '68c184e2e2a0e5fa25ece076';
    console.log('Testing loan ID:', loanId);
    
    const loan = await Loan.findById(loanId).populate('borrower', 'firstName lastName email');
    if (!loan) {
      console.log('❌ Loan not found');
      return;
    }
    
    console.log('✅ Loan found:', {
      id: loan._id,
      borrower: loan.borrower,
      status: loan.status,
      amount: loan.loanAmount
    });
    
    // Check if borrower wallet exists
    const borrowerWallet = await Wallet.findOne({ user: loan.borrower._id });
    if (!borrowerWallet) {
      console.log('❌ Borrower wallet not found');
      return;
    }
    
    console.log('✅ Borrower wallet found:', {
      balance: borrowerWallet.balance,
      currency: borrowerWallet.currency
    });
    
    // Check if lender wallet exists
    const lenders = await User.find({ userType: 'lender' });
    if (lenders.length === 0) {
      console.log('❌ No lenders found');
      return;
    }
    
    const lenderWallet = await Wallet.findOne({ user: lenders[0]._id });
    if (!lenderWallet) {
      console.log('❌ Lender wallet not found');
      return;
    }
    
    console.log('✅ Lender wallet found:', {
      balance: lenderWallet.balance,
      currency: lenderWallet.currency
    });
    
    console.log('✅ All database checks passed');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testDatabase();

