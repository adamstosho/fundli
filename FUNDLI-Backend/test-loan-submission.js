const mongoose = require('mongoose');
const Loan = require('./src/models/Loan');
const User = require('./src/models/User');

// Test loan submission functionality
async function testLoanSubmission() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/fundli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if there are any existing loans
    const existingLoans = await Loan.find({});
    console.log(`📊 Found ${existingLoans.length} existing loans in database`);

    if (existingLoans.length > 0) {
      console.log('📋 Existing loans:');
      existingLoans.forEach(loan => {
        console.log(`  - ID: ${loan._id}`);
        console.log(`    Borrower: ${loan.borrower}`);
        console.log(`    Amount: $${loan.loanAmount}`);
        console.log(`    Status: ${loan.status}`);
        console.log(`    Created: ${loan.createdAt}`);
        console.log('---');
      });
    }

    // Check if there are any users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users in database`);

    if (users.length > 0) {
      console.log('👤 Sample users:');
      users.slice(0, 3).forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`    Type: ${user.userType}, KYC: ${user.kycStatus}`);
      });
    }

    // Test creating a sample loan
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testing loan creation for user: ${testUser.firstName} ${testUser.lastName}`);

      const testLoan = new Loan({
        borrower: testUser._id,
        loanAmount: 5000,
        purpose: 'business',
        purposeDescription: 'Test loan for business expansion',
        duration: 12,
        interestRate: 8.5,
        repaymentSchedule: 'monthly',
        monthlyPayment: 438.71,
        totalRepayment: 5264.52,
        totalInterest: 264.52,
        amountRemaining: 5264.52,
        status: 'pending',
        submittedAt: new Date()
      });

      await testLoan.save();
      console.log(`✅ Test loan created successfully with ID: ${testLoan._id}`);

      // Verify the loan was saved
      const savedLoan = await Loan.findById(testLoan._id);
      if (savedLoan) {
        console.log(`✅ Loan verified in database: ${savedLoan.status} status`);
      }

      // Clean up test loan
      await Loan.findByIdAndDelete(testLoan._id);
      console.log('🧹 Test loan cleaned up');
    }

    console.log('\n🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testLoanSubmission();
