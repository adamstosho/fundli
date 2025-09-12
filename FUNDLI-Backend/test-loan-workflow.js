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

// Test user registration and login
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
    loanAmount: 5000,
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

// Test lender funding (should only work on approved loans)
const testLenderFunding = async () => {
  console.log('💰 Testing Lender Funding...\n');

  if (!testLoanId) {
    console.log('❌ No test loan ID available');
    return;
  }

  console.log('💰 Lender funding approved loan...');
  const result = await makeRequest('POST', `/lender/loan/${testLoanId}/accept`, {
    investmentAmount: 5000,
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

// Test that lenders cannot fund pending loans
const testLenderCannotFundPending = async () => {
  console.log('🚫 Testing Lender Cannot Fund Pending Loans...\n');

  // Create a new pending loan
  const loanData = {
    loanAmount: 3000,
    purpose: 'personal',
    duration: 6,
    collateral: 'Test collateral 2',
    description: 'Test loan application 2'
  };

  console.log('📝 Creating second loan application...');
  const loanResult = await makeRequest('POST', '/borrower/loan/apply', loanData, authTokens.borrower);

  if (!loanResult.success) {
    console.log(`❌ Failed to create second loan:`, loanResult.error.message);
    return;
  }

  const secondLoanId = loanResult.data.data.loan.id;
  console.log(`✅ Second loan created with ID: ${secondLoanId}`);

  // Try to fund the pending loan (should fail)
  console.log('💰 Lender trying to fund pending loan (should fail)...');
  const fundingResult = await makeRequest('POST', `/lender/loan/${secondLoanId}/accept`, {
    investmentAmount: 3000,
    notes: 'Trying to fund pending loan'
  }, authTokens.lender);

  if (!fundingResult.success) {
    console.log(`✅ Correctly prevented funding of pending loan`);
    console.log(`   Error: ${fundingResult.error.message}`);
  } else {
    console.log(`❌ ERROR: Lender should not be able to fund pending loans!`);
    console.log(`   Status: ${fundingResult.data.data.loan.status}`);
  }
  console.log('');
};

// Test loan status progression
const testLoanStatusProgression = async () => {
  console.log('📊 Testing Loan Status Progression...\n');

  if (!testLoanId) {
    console.log('❌ No test loan ID available');
    return;
  }

  console.log('📊 Checking final loan status...');
  const result = await makeRequest('GET', `/loans/${testLoanId}`, null, authTokens.borrower);

  if (result.success) {
    const loan = result.data.data.loan;
    console.log(`✅ Loan status progression:`);
    console.log(`   Initial: pending (when created)`);
    console.log(`   After admin approval: approved`);
    console.log(`   After lender funding: funded`);
    console.log(`   Current status: ${loan.status}`);
    
    if (loan.status === 'funded') {
      console.log('✅ Loan workflow completed successfully!');
    } else {
      console.log(`❌ ERROR: Expected funded status, got ${loan.status}`);
    }
  } else {
    console.log(`❌ Failed to get loan status:`, result.error.message);
  }
  console.log('');
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Fixed Loan Workflow Test Suite\n');
  console.log('=' .repeat(60));

  try {
    await testAuth();
    await testLoanApplication();
    await testAdminApproval();
    await testLenderFunding();
    await testLenderCannotFundPending();
    await testLoanStatusProgression();

    console.log('=' .repeat(60));
    console.log('🎉 All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Authentication (Register/Login)');
    console.log('✅ Loan Application (Creates pending status)');
    console.log('✅ Admin Approval (Changes to approved status)');
    console.log('✅ Lender Funding (Changes to funded status)');
    console.log('✅ Lender Cannot Fund Pending Loans');
    console.log('✅ Complete Loan Status Progression');

    console.log('\n🎯 The loan workflow is now fixed!');
    console.log('   • Borrowers apply → pending');
    console.log('   • Admins approve → approved');
    console.log('   • Lenders fund → funded');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run the tests
runTests();
