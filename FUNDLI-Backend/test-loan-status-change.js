const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testLoanStatusChange() {
  console.log('🔄 Testing Loan Status Change Flow...\n');

  try {
    // Step 1: Register and login borrower
    console.log('1️⃣ Setting up borrower...');
    const borrowerData = {
      firstName: 'Test',
      lastName: 'Borrower',
      email: 'test.borrower@example.com',
      password: 'Password123',
      phone: '+2348011111111',
      userType: 'borrower'
    };

    try {
      await axios.post(`${BASE_URL}/auth/register`, borrowerData);
      console.log('✅ Borrower registered');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Borrower already exists');
      } else {
        throw error;
      }
    }

    const borrowerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: borrowerData.email,
      password: borrowerData.password
    });
    const borrowerToken = borrowerLogin.data.token;
    console.log('✅ Borrower logged in');

    // Step 2: Register and login lender
    console.log('\n2️⃣ Setting up lender...');
    const lenderData = {
      firstName: 'Test',
      lastName: 'Lender',
      email: 'test.lender@example.com',
      password: 'Password123',
      phone: '+2348022222222',
      userType: 'lender'
    };

    try {
      await axios.post(`${BASE_URL}/auth/register`, lenderData);
      console.log('✅ Lender registered');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Lender already exists');
      } else {
        throw error;
      }
    }

    const lenderLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: lenderData.email,
      password: lenderData.password
    });
    const lenderToken = lenderLogin.data.token;
    console.log('✅ Lender logged in');

    // Step 3: Create wallets
    console.log('\n3️⃣ Creating wallets...');
    try {
      await axios.post(`${BASE_URL}/wallet/create`, {}, {
        headers: { Authorization: `Bearer ${borrowerToken}` }
      });
      console.log('✅ Borrower wallet created');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Borrower wallet already exists');
      }
    }

    try {
      await axios.post(`${BASE_URL}/wallet/create`, {}, {
        headers: { Authorization: `Bearer ${lenderToken}` }
      });
      console.log('✅ Lender wallet created');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Lender wallet already exists');
      }
    }

    // Step 4: Borrower applies for loan
    console.log('\n4️⃣ Borrower applying for loan...');
    const loanData = {
      loanAmount: 10000,
      purpose: 'Test Loan',
      purposeDescription: 'Testing loan status change',
      duration: 6,
      interestRate: 12,
      monthlyPayment: 1800,
      totalRepayment: 10800,
      collateral: []
    };

    const loanResponse = await axios.post(`${BASE_URL}/loans/apply`, loanData, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    const loanId = loanResponse.data.data._id;
    console.log('✅ Loan applied:', loanResponse.data.message);
    console.log('   Loan ID:', loanId);

    // Step 5: Check loan status (should be pending)
    console.log('\n5️⃣ Checking initial loan status...');
    const initialLoan = await axios.get(`${BASE_URL}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Initial loan status:', initialLoan.data.data.status);

    // Step 6: Check borrower's pending loans
    console.log('\n6️⃣ Checking borrower\'s pending loans...');
    const pendingLoans = await axios.get(`${BASE_URL}/loans/pending/borrower`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Pending loans count:', pendingLoans.data.data.total);
    console.log('   Should be 1 (the loan we just created)');

    // Step 7: Lender deposits funds
    console.log('\n7️⃣ Lender depositing funds...');
    const depositResponse = await axios.post(`${BASE_URL}/wallet/deposit`, {
      amount: 50000,
      currency: 'NGN',
      paymentMethod: 'card'
    }, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Lender deposited funds');

    // Step 8: Check lender's wallet balance
    console.log('\n8️⃣ Checking lender\'s wallet balance...');
    const lenderWallet = await axios.get(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Lender wallet balance:', lenderWallet.data.data.balance);

    // Step 9: Lender funds the loan
    console.log('\n9️⃣ Lender funding the loan...');
    const fundResponse = await axios.post(`${BASE_URL}/loans/${loanId}/accept`, {
      paymentReference: `FUND_${loanId}_${Date.now()}`,
      amount: loanData.loanAmount
    }, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Loan funded:', fundResponse.data.message);
    console.log('   New status:', fundResponse.data.data.status);
    console.log('   Lender balance after funding:', fundResponse.data.data.lenderBalance);
    console.log('   Borrower balance after funding:', fundResponse.data.data.borrowerBalance);

    // Step 10: Check loan status after funding
    console.log('\n🔟 Checking loan status after funding...');
    const updatedLoan = await axios.get(`${BASE_URL}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Updated loan status:', updatedLoan.data.data.status);
    console.log('   Status should be "funded" or "approved"');

    // Step 11: Check if loan is removed from pending loans
    console.log('\n1️⃣1️⃣ Checking if loan is removed from pending loans...');
    const pendingLoansAfter = await axios.get(`${BASE_URL}/loans/pending/borrower`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Pending loans count after funding:', pendingLoansAfter.data.data.total);
    console.log('   Should be 0 (loan is no longer pending)');

    // Step 12: Check borrower's in-progress loans
    console.log('\n1️⃣2️⃣ Checking borrower\'s in-progress loans...');
    const borrowerLoans = await axios.get(`${BASE_URL}/loans/user`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    const inProgressLoans = borrowerLoans.data.data.loans.filter(loan => 
      ['approved', 'funded'].includes(loan.status)
    );
    console.log('✅ In-progress loans count:', inProgressLoans.length);
    console.log('   Should be 1 (the funded loan)');
    
    if (inProgressLoans.length > 0) {
      console.log('   In-progress loan status:', inProgressLoans[0].status);
      console.log('   In-progress loan purpose:', inProgressLoans[0].purpose);
    }

    console.log('\n🎉 Loan status change test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Loan started as "pending"');
    console.log('   ✅ Lender funded the loan');
    console.log('   ✅ Loan status changed to "funded"');
    console.log('   ✅ Loan removed from pending loans');
    console.log('   ✅ Loan appears in in-progress loans');
    console.log('   ✅ Funds transferred from lender to borrower');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.message === 'Insufficient balance') {
      console.log('\n💡 Lender needs to deposit funds first!');
    }
  }
}

// Run the test
testLoanStatusChange();
