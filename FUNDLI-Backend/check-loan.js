const mongoose = require('mongoose');
const Loan = require('./src/models/Loan');

async function checkLoan() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect('mongodb+srv://test:test123@cluster0.mongodb.net/fundli-test?retryWrites=true&w=majority');
    console.log('✅ Connected to database');
    
    const loanId = '68c184e2e2a0e5fa25ece076';
    console.log('Checking loan:', loanId);
    
    const loan = await Loan.findById(loanId).populate('borrower', 'firstName lastName email');
    if (!loan) {
      console.log('❌ Loan not found');
      
      // Check if there are any loans in the database
      const allLoans = await Loan.find({}).limit(5);
      console.log('Available loans:', allLoans.map(l => ({ id: l._id, status: l.status, amount: l.loanAmount })));
      return;
    }
    
    console.log('✅ Loan found:', {
      id: loan._id,
      status: loan.status,
      amount: loan.loanAmount,
      borrower: loan.borrower
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkLoan();

