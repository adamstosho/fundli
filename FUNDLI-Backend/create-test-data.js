const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Loan = require('./src/models/Loan');
const Notification = require('./src/models/Notification');

// Simple MongoDB connection
const MONGODB_URI = 'mongodb+srv://fundli:fundli123@cluster0.vixdbhc.mongodb.net/fundli?retryWrites=true&w=majority';

async function createTestData() {
  try {
    console.log('🔍 Creating test data...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test borrower
    let borrower = await User.findOne({ email: 'borrower@test.com' });
    if (!borrower) {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      borrower = new User({
        firstName: 'Test',
        lastName: 'Borrower',
        email: 'borrower@test.com',
        phone: '+1234567890',
        password: hashedPassword,
        userType: 'borrower',
        kycStatus: 'approved',
        isEmailVerified: true,
        creditScore: 650
      });
      await borrower.save();
      console.log('✅ Test borrower created');
    } else {
      console.log('✅ Test borrower already exists');
    }

    // Create test lender
    let lender = await User.findOne({ email: 'lender@test.com' });
    if (!lender) {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      lender = new User({
        firstName: 'Test',
        lastName: 'Lender',
        email: 'lender@test.com',
        phone: '+1234567890',
        password: hashedPassword,
        userType: 'lender',
        kycStatus: 'approved',
        isEmailVerified: true,
        creditScore: 750
      });
      await lender.save();
      console.log('✅ Test lender created');
    } else {
      console.log('✅ Test lender already exists');
    }

    // Create test admin
    let admin = await User.findOne({ email: 'admin@test.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      admin = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        phone: '+1234567890',
        password: hashedPassword,
        userType: 'admin',
        kycStatus: 'approved',
        isEmailVerified: true,
        creditScore: 800
      });
      await admin.save();
      console.log('✅ Test admin created');
    } else {
      console.log('✅ Test admin already exists');
    }

    // Create test loan application
    let loan = await Loan.findOne({ borrower: borrower._id });
    if (!loan) {
      loan = new Loan({
        borrower: borrower._id,
        loanAmount: 50000,
        purpose: 'Business Expansion',
        purposeDescription: 'Loan application for business expansion - Property collateral provided',
        duration: 12,
        interestRate: 8,
        monthlyPayment: 4395.84,
        totalRepayment: 52750.08,
        totalInterest: 2750.08,
        amountRemaining: 52750.08,
        collateral: {
          type: 'property',
          description: 'Commercial property in downtown area',
          estimatedValue: 100000,
          documents: []
        },
        status: 'pending',
        kycStatus: 'verified',
        fundingProgress: {
          targetAmount: 50000,
          fundedAmount: 0
        },
        submittedAt: new Date()
      });
      await loan.save();
      console.log('✅ Test loan created');
    } else {
      console.log('✅ Test loan already exists');
    }

    // Create test notification for lender
    let notification = await Notification.findOne({ recipient: lender._id });
    if (!notification) {
      notification = new Notification({
        recipient: lender._id,
        type: 'new_approved_loan',
        title: 'New Loan Available for Funding! 💰',
        message: 'A new loan application has been approved: $50,000 for Business Expansion by Test Borrower. Check it out!',
        priority: 'high',
        status: 'unread',
        actionRequired: true,
        metadata: {
          loanId: loan._id,
          loanAmount: 50000,
          purpose: 'Business Expansion',
          borrowerName: 'Test Borrower',
          action: 'view_loan'
        }
      });
      await notification.save();
      console.log('✅ Test notification created');
    } else {
      console.log('✅ Test notification already exists');
    }

    console.log('🎉 Test data creation complete!');
    console.log('📊 Summary:');
    console.log('  - Borrower: borrower@test.com / TestPassword123!');
    console.log('  - Lender: lender@test.com / TestPassword123!');
    console.log('  - Admin: admin@test.com / TestPassword123!');
    console.log('  - Loan: $50,000 Business Expansion (pending)');
    console.log('  - Notification: New loan available for lender');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestData();




