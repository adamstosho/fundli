const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Loan = require('./src/models/Loan');
const Wallet = require('./src/models/Wallet');

// Use the same connection as the backend
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://test:test123@cluster0.mongodb.net/fundli-test?retryWrites=true&w=majority';

async function createTestInvestments() {
  try {
    console.log('🔍 Creating test investments...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create test lender
    let lender = await User.findOne({ email: 'testlender@example.com' });
    if (!lender) {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      lender = new User({
        firstName: 'Test',
        lastName: 'Lender',
        email: 'testlender@example.com',
        phone: '+1234567890',
        password: hashedPassword,
        userType: 'lender',
        kycStatus: 'approved',
        isEmailVerified: true
      });
      await lender.save();
      console.log('✅ Test lender created');
    } else {
      console.log('✅ Test lender already exists');
    }

    // Find or create test borrower
    let borrower = await User.findOne({ email: 'testborrower@example.com' });
    if (!borrower) {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      borrower = new User({
        firstName: 'Test',
        lastName: 'Borrower',
        email: 'testborrower@example.com',
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

    // Create wallets for both users
    let lenderWallet = await Wallet.findOne({ user: lender._id });
    if (!lenderWallet) {
      lenderWallet = new Wallet({
        user: lender._id,
        balance: 100000, // Give lender 100k for testing
        currency: 'NGN'
      });
      await lenderWallet.save();
      console.log('✅ Lender wallet created with balance:', lenderWallet.balance);
    }

    let borrowerWallet = await Wallet.findOne({ user: borrower._id });
    if (!borrowerWallet) {
      borrowerWallet = new Wallet({
        user: borrower._id,
        balance: 0,
        currency: 'NGN'
      });
      await borrowerWallet.save();
      console.log('✅ Borrower wallet created');
    }

    // Create test loans with investments
    const loanData = [
      {
        purpose: 'business',
        purposeDescription: 'Starting a small business',
        loanAmount: 50000,
        duration: 12,
        interestRate: 15,
        status: 'active',
        fundedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 days from now
        monthlyPayment: 4500,
        totalRepayment: 54000,
        amountPaid: 9000, // 2 months paid
        amountRemaining: 45000,
        nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        repayments: [
          { amount: 4500, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { amount: 4500, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        purpose: 'education',
        purposeDescription: 'University tuition fees',
        loanAmount: 75000,
        duration: 24,
        interestRate: 12,
        status: 'completed',
        fundedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        monthlyPayment: 3500,
        totalRepayment: 84000,
        amountPaid: 84000, // Fully paid
        amountRemaining: 0,
        completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        repayments: [
          { amount: 3500, date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 335 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 305 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 275 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 245 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 215 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 185 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 155 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000) },
          { amount: 3500, date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        purpose: 'personal',
        purposeDescription: 'Emergency medical expenses',
        loanAmount: 30000,
        duration: 6,
        interestRate: 18,
        status: 'funded',
        fundedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 173 * 24 * 60 * 60 * 1000), // 173 days from now
        monthlyPayment: 5500,
        totalRepayment: 33000,
        amountPaid: 0,
        amountRemaining: 33000,
        nextPaymentDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
        repayments: []
      }
    ];

    for (let i = 0; i < loanData.length; i++) {
      const loanInfo = loanData[i];
      
      // Check if loan already exists
      let existingLoan = await Loan.findOne({ 
        borrower: borrower._id, 
        purpose: loanInfo.purpose,
        loanAmount: loanInfo.loanAmount 
      });
      
      if (!existingLoan) {
        const loan = new Loan({
          borrower: borrower._id,
          ...loanInfo,
          fundingProgress: {
            fundedAmount: loanInfo.loanAmount,
            targetAmount: loanInfo.loanAmount,
            investors: [{
              user: lender._id,
              amount: loanInfo.loanAmount,
              investedAt: loanInfo.fundedAt,
              notes: `Investment in ${loanInfo.purpose} loan`
            }]
          },
          collateral: {
            type: 'vehicle',
            description: '2018 Toyota Camry',
            estimatedValue: loanInfo.loanAmount * 1.5,
            verificationStatus: 'verified'
          },
          riskScore: 6
        });
        
        await loan.save();
        console.log(`✅ Loan ${i + 1} created: ${loanInfo.purpose} - ₦${loanInfo.loanAmount.toLocaleString()}`);
      } else {
        console.log(`✅ Loan ${i + 1} already exists: ${loanInfo.purpose}`);
      }
    }

    console.log('🎉 Test investments created successfully!');
    console.log('📊 Summary:');
    console.log('- 1 Active loan (Business - ₦50,000)');
    console.log('- 1 Completed loan (Education - ₦75,000)');
    console.log('- 1 Funded loan (Personal - ₦30,000)');
    console.log('- Total invested: ₦155,000');
    console.log('- Total returns: ₦9,000');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test investments:', error);
    process.exit(1);
  }
}

createTestInvestments();




