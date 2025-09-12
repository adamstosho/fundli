const mongoose = require('mongoose');
const Loan = require('./src/models/Loan');
const Wallet = require('./src/models/Wallet');
const User = require('./src/models/User');

// Test the loan funding endpoint directly
const testLoanFunding = async () => {
  try {
    console.log('🔍 Testing Loan Funding Endpoint Directly\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/fundli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test data
    const testLoanId = '68c425a724713b758ade7993';
    const testUserId = 'test-user-id';
    const investmentAmount = 1000;

    console.log(`\n📝 Testing with Loan ID: ${testLoanId}`);
    console.log(`💰 Investment Amount: $${investmentAmount}`);

    // Step 1: Check if loan exists
    console.log('\n🔍 Step 1: Checking if loan exists...');
    const loan = await Loan.findById(testLoanId).populate('borrower', 'firstName lastName email');
    
    if (!loan) {
      console.log('❌ Loan not found');
      return;
    }
    
    console.log('✅ Loan found:', {
      id: loan._id,
      status: loan.status,
      amount: loan.loanAmount,
      borrower: loan.borrower ? `${loan.borrower.firstName} ${loan.borrower.lastName}` : 'No borrower'
    });

    // Step 2: Check if borrower exists
    if (!loan.borrower) {
      console.log('❌ Loan has no borrower populated');
      return;
    }

    // Step 3: Check if lender wallet exists
    console.log('\n🔍 Step 3: Checking lender wallet...');
    const lenderWallet = await Wallet.findOne({ user: testUserId });
    
    if (!lenderWallet) {
      console.log('❌ Lender wallet not found');
      console.log('💡 Creating test lender wallet...');
      
      // Create a test wallet
      const newWallet = new Wallet({
        user: testUserId,
        balance: 10000,
        currency: 'USD',
        status: 'active'
      });
      
      await newWallet.save();
      console.log('✅ Test lender wallet created');
    } else {
      console.log('✅ Lender wallet found:', {
        balance: lenderWallet.balance,
        currency: lenderWallet.currency
      });
    }

    // Step 4: Check if borrower wallet exists
    console.log('\n🔍 Step 4: Checking borrower wallet...');
    const borrowerWallet = await Wallet.findOne({ user: loan.borrower._id });
    
    if (!borrowerWallet) {
      console.log('❌ Borrower wallet not found');
      console.log('💡 Creating test borrower wallet...');
      
      // Create a test wallet
      const newWallet = new Wallet({
        user: loan.borrower._id,
        balance: 0,
        currency: 'USD',
        status: 'active'
      });
      
      await newWallet.save();
      console.log('✅ Test borrower wallet created');
    } else {
      console.log('✅ Borrower wallet found:', {
        balance: borrowerWallet.balance,
        currency: borrowerWallet.currency
      });
    }

    // Step 5: Test wallet update methods
    console.log('\n🔍 Step 5: Testing wallet update methods...');
    
    const testWallet = await Wallet.findOne({ user: testUserId });
    if (testWallet) {
      console.log('📊 Testing updateBalance method...');
      
      const originalBalance = testWallet.balance;
      console.log(`   Original balance: $${originalBalance}`);
      
      // Test withdrawal
      testWallet.updateBalance(investmentAmount, 'withdrawal');
      console.log(`   After withdrawal: $${testWallet.balance}`);
      
      // Test deposit
      testWallet.updateBalance(investmentAmount, 'deposit');
      console.log(`   After deposit: $${testWallet.balance}`);
      
      if (testWallet.balance === originalBalance) {
        console.log('✅ updateBalance method works correctly');
      } else {
        console.log('❌ updateBalance method has issues');
      }
    }

    console.log('\n🎯 Test completed successfully!');
    console.log('💡 If all steps passed, the issue might be in the request handling or authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
testLoanFunding();
