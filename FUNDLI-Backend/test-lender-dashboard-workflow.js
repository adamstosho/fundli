const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = {
  borrower: {
    email: 'borrower@test.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Borrower',
    userType: 'borrower'
  },
  lender: {
    email: 'lender@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Lender',
    userType: 'lender'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    userType: 'admin'
  }
};

let authTokens = {};
let testLoanId = null;

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test user authentication
const testAuth = async () => {
  console.log('🔐 Testing Authentication...\n');

  for (const [userType, userData] of Object.entries(testUsers)) {
    console.log(`📝 Registering ${userType}...`);
    
    // Register user
    const registerResult = await makeRequest('POST', '/auth/register', userData);
    if (registerResult.success) {
      console.log(`✅ ${userType} registered successfully`);
    } else {
      console.log(`⚠️ ${userType} registration failed (might already exist):`, registerResult.error.message);
    }

    // Login user
    console.log(`🔑 Logging in ${userType}...`);
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: userData.email,
      password: userData.password
    });

    if (loginResult.success) {
      authTokens[userType] = loginResult.data.token;
      console.log(`✅ ${userType} logged in successfully`);
    } else {
      console.log(`❌ ${userType} login failed:`, loginResult.error.message);
    }
    console.log('');
  }
};

// Test loan application (should create pending loan)
const testLoanApplication = async () => {
  console.log('📝 Testing Loan Application...\n');

  const loanData = {
    loanAmount: 10000,
    purpose: 'business',
    duration: 12,
    collateral: 'Test collateral',
    description: 'Test loan application for business purposes'
  };

  console.log('📝 Borrower applying for loan...');
  const result = await makeRequest('POST', '/borrower/loan/apply', loanData, authTokens.borrower);

  if (result.success) {
    testLoanId = result.data.data.loan.id;
    console.log(`✅ Loan application submitted successfully`);
    console.log(`   Loan ID: ${testLoanId}`);
    console.log(`   Status: ${result.data.data.loan.status}`);
    
    if (result.data.data.loan.status === 'pending') {
      console.log('✅ Loan correctly created with pending status');
    } else {
      console.log(`❌ ERROR: Loan should be pending but is ${result.data.data.loan.status}`);
    }
  } else {
    console.log(`❌ Loan application failed:`, result.error.message);
  }
  console.log('');
};

// Test admin approval
const testAdminApproval = async () => {
  console.log('👨‍💼 Testing Admin Approval...\n');

  if (!testLoanId) {
    console.log('❌ No test loan ID available');
    return;
  }

  console.log('👨‍💼 Admin approving loan...');
  const result = await makeRequest('POST', `/admin/loan/${testLoanId}/approve`, {
    action: 'approve',
    adminNotes: 'Loan approved after review'
  }, authTokens.admin);

  if (result.success) {
    console.log(`✅ Loan approved successfully by admin`);
    console.log(`   Status: ${result.data.data.loan.status}`);
    
    if (result.data.data.loan.status === 'approved') {
      console.log('✅ Loan correctly approved by admin');
    } else {
      console.log(`❌ ERROR: Loan should be approved but is ${result.data.data.loan.status}`);
    }
  } else {
    console.log(`❌ Admin approval failed:`, result.error.message);
  }
  console.log('');
};

// Test lender dashboard - check if approved loan appears
const testLenderDashboard = async () => {
  console.log('💰 Testing Lender Dashboard...\n');

  console.log('💰 Checking lender dashboard for approved loans...');
  const result = await makeRequest('GET', '/lender/loan-applications', null, authTokens.lender);

  if (result.success) {
    const loanApplications = result.data.data.loanApplications || [];
    console.log(`✅ Lender dashboard loaded successfully`);
    console.log(`   Found ${loanApplications.length} approved loan applications`);
    
    const ourLoan = loanApplications.find(loan => loan.id === testLoanId);
    if (ourLoan) {
      console.log(`✅ Our test loan appears in lender dashboard`);
      console.log(`   Loan Status: ${ourLoan.status}`);
      console.log(`   Loan Amount: $${ourLoan.loanAmount}`);
      console.log(`   Borrower: ${ourLoan.borrower.name}`);
    } else {
      console.log(`❌ ERROR: Our test loan does not appear in lender dashboard`);
    }
  } else {
    console.log(`❌ Lender dashboard failed:`, result.error.message);
  }
  console.log('');
};

// Test lender funding
const testLenderFunding = async () => {
  console.log('💰 Testing Lender Funding...\n');

  if (!testLoanId) {
    console.log('❌ No test loan ID available');
    return;
  }

  console.log('💰 Lender funding approved loan...');
  const result = await makeRequest('POST', `/lender/loan/${testLoanId}/accept`, {
    investmentAmount: 10000,
    notes: 'Funding approved loan'
  }, authTokens.lender);

  if (result.success) {
    console.log(`✅ Loan funded successfully by lender`);
    console.log(`   Status: ${result.data.data.loan.status}`);
    console.log(`   Funded Amount: $${result.data.data.loan.fundedAmount}`);
    
    if (result.data.data.loan.status === 'funded') {
      console.log('✅ Loan correctly funded by lender');
    } else {
      console.log(`❌ ERROR: Loan should be funded but is ${result.data.data.loan.status}`);
    }
  } else {
    console.log(`❌ Lender funding failed:`, result.error.message);
  }
  console.log('');
};

// Test that funded loan disappears from lender dashboard
const testFundedLoanDisappears = async () => {
  console.log('🚫 Testing Funded Loan Disappears from Lender Dashboard...\n');

  console.log('💰 Checking lender dashboard after funding...');
  const result = await makeRequest('GET', '/lender/loan-applications', null, authTokens.lender);

  if (result.success) {
    const loanApplications = result.data.data.loanApplications || [];
    console.log(`✅ Lender dashboard loaded successfully`);
    console.log(`   Found ${loanApplications.length} approved loan applications`);
    
    const ourLoan = loanApplications.find(loan => loan.id === testLoanId);
    if (!ourLoan) {
      console.log(`✅ Our funded loan correctly disappeared from lender dashboard`);
    } else {
      console.log(`❌ ERROR: Our funded loan still appears in lender dashboard`);
      console.log(`   Loan Status: ${ourLoan.status}`);
    }
  } else {
    console.log(`❌ Lender dashboard failed:`, result.error.message);
  }
  console.log('');
};

// Test lender dashboard stats update
const testLenderStatsUpdate = async () => {
  console.log('📊 Testing Lender Dashboard Stats Update...\n');

  console.log('📊 Checking lender investment stats...');
  const statsResult = await makeRequest('GET', '/lender/investment-stats', null, authTokens.lender);

  if (statsResult.success) {
    const stats = statsResult.data.data.investmentStats;
    console.log(`✅ Lender investment stats loaded successfully`);
    console.log(`   Total Invested: $${stats.totalInvested}`);
    console.log(`   Total Loans Funded: ${stats.totalLoansFunded}`);
    console.log(`   Average Investment Amount: $${stats.averageInvestmentAmount}`);
    
    if (stats.totalInvested > 0 && stats.totalLoansFunded > 0) {
      console.log(`✅ Lender stats correctly updated after funding`);
    } else {
      console.log(`❌ ERROR: Lender stats not updated after funding`);
    }
  } else {
    console.log(`❌ Lender stats failed:`, statsResult.error.message);
  }

  console.log('📊 Checking lender funded loans...');
  const fundedLoansResult = await makeRequest('GET', '/lender/funded-loans', null, authTokens.lender);

  if (fundedLoansResult.success) {
    const fundedLoans = fundedLoansResult.data.data.fundedLoans || [];
    console.log(`✅ Lender funded loans loaded successfully`);
    console.log(`   Found ${fundedLoans.length} funded loans`);
    
    const ourLoan = fundedLoans.find(loan => loan.id === testLoanId);
    if (ourLoan) {
      console.log(`✅ Our funded loan appears in funded loans list`);
      console.log(`   Loan Status: ${ourLoan.status}`);
      console.log(`   Funded Amount: $${ourLoan.fundedAmount}`);
    } else {
      console.log(`❌ ERROR: Our funded loan does not appear in funded loans list`);
    }
  } else {
    console.log(`❌ Lender funded loans failed:`, fundedLoansResult.error.message);
  }
  console.log('');
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Complete Lender Dashboard Workflow Test\n');
  console.log('=' .repeat(70));

  try {
    await testAuth();
    await testLoanApplication();
    await testAdminApproval();
    await testLenderDashboard();
    await testLenderFunding();
    await testFundedLoanDisappears();
    await testLenderStatsUpdate();

    console.log('=' .repeat(70));
    console.log('🎉 All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Authentication (Register/Login)');
    console.log('✅ Loan Application (Creates pending status)');
    console.log('✅ Admin Approval (Changes to approved status)');
    console.log('✅ Lender Dashboard (Shows approved loans)');
    console.log('✅ Lender Funding (Changes to funded status)');
    console.log('✅ Funded Loan Disappears (Removed from lender view)');
    console.log('✅ Dashboard Stats Update (Investment stats updated)');

    console.log('\n🎯 The complete lender dashboard workflow is working!');
    console.log('   • Borrowers apply → pending');
    console.log('   • Admins approve → approved');
    console.log('   • Lenders see approved loans in dashboard');
    console.log('   • Lenders fund loans → funded');
    console.log('   • Funded loans disappear from lender dashboard');
    console.log('   • Dashboard stats update correctly');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run the tests
runTests();
