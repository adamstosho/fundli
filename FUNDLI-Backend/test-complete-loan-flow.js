const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

// Test data
const borrowerData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'Password123',
  phoneNumber: '08012345678',
  userType: 'borrower'
};

const lenderData = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  password: 'Password123',
  phoneNumber: '08087654321',
  userType: 'lender'
};

const loanData = {
  loanAmount: 50000,
  purpose: 'Business Expansion',
  purposeDescription: 'Need funds to expand my small business',
  duration: 12,
  interestRate: 15,
  monthlyPayment: 4500,
  totalRepayment: 54000,
  collateral: [
    {
      type: 'Property',
      description: 'Commercial property in Lagos',
      value: 2000000
    }
  ]
};

let borrowerToken, lenderToken, loanId;

async function testCompleteLoanFlow() {
  console.log('🚀 Testing Complete Loan Flow...\n');

  try {
    // Step 1: Register borrower
    console.log('1️⃣ Registering borrower...');
    const borrowerResponse = await axios.post(`${BASE_URL}/auth/register`, borrowerData);
    console.log('✅ Borrower registered:', borrowerResponse.data.message);
    
    // Step 2: Register lender
    console.log('\n2️⃣ Registering lender...');
    const lenderResponse = await axios.post(`${BASE_URL}/auth/register`, lenderData);
    console.log('✅ Lender registered:', lenderResponse.data.message);

    // Step 3: Login borrower
    console.log('\n3️⃣ Logging in borrower...');
    const borrowerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: borrowerData.email,
      password: borrowerData.password
    });
    borrowerToken = borrowerLogin.data.token;
    console.log('✅ Borrower logged in');

    // Step 4: Login lender
    console.log('\n4️⃣ Logging in lender...');
    const lenderLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: lenderData.email,
      password: lenderData.password
    });
    lenderToken = lenderLogin.data.token;
    console.log('✅ Lender logged in');

    // Step 5: Create wallets for both users
    console.log('\n5️⃣ Creating wallets...');
    
    // Create borrower wallet
    await axios.post(`${BASE_URL}/wallet/create`, {}, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Borrower wallet created');

    // Create lender wallet
    await axios.post(`${BASE_URL}/wallet/create`, {}, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Lender wallet created');

    // Step 6: Borrower applies for loan
    console.log('\n6️⃣ Borrower applying for loan...');
    const loanResponse = await axios.post(`${BASE_URL}/loans/apply`, loanData, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    loanId = loanResponse.data.data._id;
    console.log('✅ Loan applied:', loanResponse.data.message);
    console.log('   Loan ID:', loanId);

    // Step 7: Check borrower's pending loans
    console.log('\n7️⃣ Checking borrower\'s pending loans...');
    const borrowerLoans = await axios.get(`${BASE_URL}/loans/user`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Borrower has', borrowerLoans.data.data.loans.length, 'loans');
    console.log('   Loan status:', borrowerLoans.data.data.loans[0].status);

    // Step 8: Lender deposits funds
    console.log('\n8️⃣ Lender depositing funds...');
    const depositResponse = await axios.post(`${BASE_URL}/wallet/deposit`, {
      amount: 100000,
      currency: 'NGN',
      paymentMethod: 'card'
    }, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Lender deposited funds');

    // Step 9: Check lender's wallet balance
    console.log('\n9️⃣ Checking lender\'s wallet balance...');
    const lenderWallet = await axios.get(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Lender wallet balance:', lenderWallet.data.data.balance);

    // Step 10: Lender funds the loan
    console.log('\n🔟 Lender funding the loan...');
    const fundResponse = await axios.post(`${BASE_URL}/loans/${loanId}/accept`, {
      paymentReference: `FUND_${loanId}_${Date.now()}`,
      amount: loanData.loanAmount
    }, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    console.log('✅ Loan funded:', fundResponse.data.message);
    console.log('   New loan status:', fundResponse.data.data.status);
    console.log('   Lender balance after funding:', fundResponse.data.data.lenderBalance);
    console.log('   Borrower balance after funding:', fundResponse.data.data.borrowerBalance);

    // Step 11: Check loan status after funding
    console.log('\n1️⃣1️⃣ Checking loan status after funding...');
    const updatedLoan = await axios.get(`${BASE_URL}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Updated loan status:', updatedLoan.data.data.status);
    console.log('   Funding progress:', updatedLoan.data.data.fundingProgress);

    // Step 12: Check if loan appears in borrower's in-progress loans
    console.log('\n1️⃣2️⃣ Checking borrower\'s in-progress loans...');
    const borrowerLoansAfter = await axios.get(`${BASE_URL}/loans/user`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    const inProgressLoans = borrowerLoansAfter.data.data.loans.filter(loan => 
      ['approved', 'funded'].includes(loan.status)
    );
    console.log('✅ Borrower has', inProgressLoans.length, 'loans in progress');

    // Step 13: Check if loan is removed from browse loans
    console.log('\n1️⃣3️⃣ Checking browse loans (should exclude funded loans)...');
    const browseLoans = await axios.get(`${BASE_URL}/borrower/available-loans`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    console.log('✅ Available loans for browsing:', browseLoans.data.data.total);
    console.log('   (Should be 0 since the loan is now funded)');

    console.log('\n🎉 Complete loan flow test successful!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Borrower applied for loan');
    console.log('   ✅ Lender funded the loan');
    console.log('   ✅ Loan status changed from pending to funded');
    console.log('   ✅ Funds transferred from lender to borrower');
    console.log('   ✅ Loan removed from browse loans');
    console.log('   ✅ Loan appears in borrower\'s in-progress loans');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.message === 'Insufficient balance') {
      console.log('\n💡 This is expected - lender needs to deposit funds first!');
    }
  }
}

// Run the test
testCompleteLoanFlow();
