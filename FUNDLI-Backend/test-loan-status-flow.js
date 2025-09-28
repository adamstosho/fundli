const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function testLoanStatusFlow() {
  console.log('🔍 Testing Loan Status Flow...\n');

  try {
    // Step 1: Login as borrower (assuming user exists)
    console.log('1️⃣ Logging in as borrower...');
    const borrowerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'john.doe@example.com',
      password: 'Password123'
    });
    const borrowerToken = borrowerLogin.data.token;
    console.log('✅ Borrower logged in');

    // Step 2: Check borrower's loans
    console.log('\n2️⃣ Checking borrower\'s loans...');
    const borrowerLoans = await axios.get(`${BASE_URL}/loans/user`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Borrower has', borrowerLoans.data.data.loans.length, 'loans');
    
    if (borrowerLoans.data.data.loans.length > 0) {
      const loan = borrowerLoans.data.data.loans[0];
      console.log('   Loan ID:', loan._id);
      console.log('   Current Status:', loan.status);
      console.log('   Purpose:', loan.purpose);
      console.log('   Amount:', loan.loanAmount);
    }

    // Step 3: Login as lender
    console.log('\n3️⃣ Logging in as lender...');
    const lenderLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'jane.smith@example.com',
      password: 'Password123'
    });
    const lenderToken = lenderLogin.data.token;
    console.log('✅ Lender logged in');

    // Step 4: Check lender's wallet
    console.log('\n4️⃣ Checking lender\'s wallet...');
    const lenderWallet = await axios.get(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Lender wallet balance:', lenderWallet.data.data.balance);

    // Step 5: Check available loans for funding
    console.log('\n5️⃣ Checking available loans for funding...');
    const availableLoans = await axios.get(`${BASE_URL}/borrower/available-loans`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Available loans:', availableLoans.data.data.total);

    if (availableLoans.data.data.total > 0) {
      const loanToFund = availableLoans.data.data.loans[0];
      console.log('   Found loan to fund:', loanToFund.id);
      console.log('   Amount:', loanToFund.loanAmount);
      console.log('   Borrower:', loanToFund.borrower.name);

      // Step 6: Fund the loan
      console.log('\n6️⃣ Funding the loan...');
      const fundResponse = await axios.post(`${BASE_URL}/loans/${loanToFund.id}/accept`, {
        paymentReference: `FUND_${loanToFund.id}_${Date.now()}`,
        amount: loanToFund.loanAmount
      }, {
        headers: { Authorization: `Bearer ${lenderToken}` }
      });
      console.log('✅ Loan funded:', fundResponse.data.message);
      console.log('   New status:', fundResponse.data.data.status);

      // Step 7: Check loan status after funding
      console.log('\n7️⃣ Checking loan status after funding...');
      const updatedLoan = await axios.get(`${BASE_URL}/loans/${loanToFund.id}`, {
        headers: { Authorization: `Bearer ${borrowerToken}` }
      });
      console.log('✅ Updated loan status:', updatedLoan.data.data.status);
      console.log('   Funding progress:', updatedLoan.data.data.fundingProgress);

      // Step 8: Check if loan is removed from browse loans
      console.log('\n8️⃣ Checking if loan is removed from browse loans...');
      const browseLoansAfter = await axios.get(`${BASE_URL}/borrower/available-loans`, {
        headers: { Authorization: `Bearer ${borrowerToken}` }
      });
      console.log('✅ Available loans after funding:', browseLoansAfter.data.data.total);

      // Step 9: Check borrower's in-progress loans
      console.log('\n9️⃣ Checking borrower\'s in-progress loans...');
      const borrowerLoansAfter = await axios.get(`${BASE_URL}/loans/user`, {
        headers: { Authorization: `Bearer ${borrowerToken}` }
      });
      const inProgressLoans = borrowerLoansAfter.data.data.loans.filter(loan => 
        ['approved', 'funded'].includes(loan.status)
      );
      console.log('✅ Borrower has', inProgressLoans.length, 'loans in progress');
      
      if (inProgressLoans.length > 0) {
        console.log('   In-progress loan status:', inProgressLoans[0].status);
        console.log('   In-progress loan purpose:', inProgressLoans[0].purpose);
      }
    }

    console.log('\n🎉 Loan status flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Users may not exist yet. Please register users first.');
    }
  }
}

// Run the test
testLoanStatusFlow();
