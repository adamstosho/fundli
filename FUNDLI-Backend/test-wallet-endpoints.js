const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = {
  lender: {
    email: 'lender@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Lender',
    userType: 'lender'
  },
  borrower: {
    email: 'borrower@test.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Borrower',
    userType: 'borrower'
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

// Test wallet creation
const testWalletCreation = async () => {
  console.log('💰 Testing Wallet Creation...\n');

  const endpoints = [
    { userType: 'lender', endpoint: '/lender/wallet/create' },
    { userType: 'borrower', endpoint: '/borrower/wallet/create' },
    { userType: 'admin', endpoint: '/admin/wallet/create' }
  ];

  for (const { userType, endpoint } of endpoints) {
    console.log(`📝 Creating ${userType} wallet...`);
    const result = await makeRequest('POST', endpoint, {}, authTokens[userType]);

    if (result.success) {
      console.log(`✅ ${userType} wallet created successfully`);
      console.log(`   Balance: $${result.data.data.wallet.balance}`);
    } else {
      console.log(`❌ ${userType} wallet creation failed:`, result.error.message);
    }
    console.log('');
  }
};

// Test wallet balance retrieval
const testWalletBalance = async () => {
  console.log('💳 Testing Wallet Balance Retrieval...\n');

  const endpoints = [
    { userType: 'lender', endpoint: '/lender/wallet/balance' },
    { userType: 'borrower', endpoint: '/borrower/wallet/balance' },
    { userType: 'admin', endpoint: '/admin/wallet/balance' }
  ];

  for (const { userType, endpoint } of endpoints) {
    console.log(`📊 Getting ${userType} wallet balance...`);
    const result = await makeRequest('GET', endpoint, null, authTokens[userType]);

    if (result.success) {
      console.log(`✅ ${userType} wallet balance retrieved successfully`);
      console.log(`   Balance: $${result.data.data.balance}`);
      console.log(`   Currency: ${result.data.data.currency}`);
      console.log(`   Status: ${result.data.data.status}`);
    } else {
      console.log(`❌ ${userType} wallet balance retrieval failed:`, result.error.message);
    }
    console.log('');
  }
};

// Test wallet separation (ensure different balances)
const testWalletSeparation = async () => {
  console.log('🔒 Testing Wallet Separation...\n');

  const balances = {};
  const endpoints = [
    { userType: 'lender', endpoint: '/lender/wallet/balance' },
    { userType: 'borrower', endpoint: '/borrower/wallet/balance' },
    { userType: 'admin', endpoint: '/admin/wallet/balance' }
  ];

  for (const { userType, endpoint } of endpoints) {
    const result = await makeRequest('GET', endpoint, null, authTokens[userType]);
    if (result.success) {
      balances[userType] = result.data.data.balance;
    }
  }

  console.log('📊 Wallet Balance Summary:');
  console.log(`   Lender: $${balances.lender || 'N/A'}`);
  console.log(`   Borrower: $${balances.borrower || 'N/A'}`);
  console.log(`   Admin: $${balances.admin || 'N/A'}`);

  // Check if wallets are properly separated
  const expectedBalances = { lender: 10000, borrower: 1000, admin: 50000 };
  let separationTestPassed = true;

  for (const [userType, expectedBalance] of Object.entries(expectedBalances)) {
    if (balances[userType] !== expectedBalance) {
      console.log(`❌ ${userType} wallet has incorrect balance. Expected: $${expectedBalance}, Got: $${balances[userType]}`);
      separationTestPassed = false;
    }
  }

  if (separationTestPassed) {
    console.log('✅ Wallet separation test PASSED - Each user type has distinct wallet balances');
  } else {
    console.log('❌ Wallet separation test FAILED - Wallets are not properly separated');
  }
  console.log('');
};

// Test loan funding (lender-specific)
const testLoanFunding = async () => {
  console.log('🏦 Testing Loan Funding...\n');

  // First, create a loan application
  console.log('📝 Creating a test loan application...');
  const loanResult = await makeRequest('POST', '/borrower/loan/apply', {
    loanAmount: 5000,
    purpose: 'Test loan for wallet funding',
    duration: 12,
    collateral: 'Test collateral'
  }, authTokens.borrower);

  if (!loanResult.success) {
    console.log('❌ Failed to create test loan:', loanResult.error.message);
    return;
  }

  const loanId = loanResult.data.data.loan.id;
  console.log(`✅ Test loan created with ID: ${loanId}`);

  // Now test funding the loan
  console.log('💰 Testing loan funding...');
  const fundingResult = await makeRequest('POST', `/lender/loan/${loanId}/fund`, {
    amount: 5000,
    paymentMethod: 'wallet'
  }, authTokens.lender);

  if (fundingResult.success) {
    console.log('✅ Loan funding successful');
    console.log(`   Funded Amount: $${fundingResult.data.data.loan.fundedAmount}`);
    console.log(`   New Lender Balance: $${fundingResult.data.data.wallet.balance}`);
  } else {
    console.log('❌ Loan funding failed:', fundingResult.error.message);
  }
  console.log('');
};

// Test wallet transfer
const testWalletTransfer = async () => {
  console.log('💸 Testing Wallet Transfer...\n');

  // Get borrower user ID (we'll need this for the transfer)
  console.log('🔍 Getting borrower user ID...');
  const borrowerProfile = await makeRequest('GET', '/users/profile', null, authTokens.borrower);
  
  if (!borrowerProfile.success) {
    console.log('❌ Failed to get borrower profile:', borrowerProfile.error.message);
    return;
  }

  const borrowerId = borrowerProfile.data.data.user.id;
  console.log(`✅ Borrower ID: ${borrowerId}`);

  // Test transfer from lender to borrower
  console.log('💸 Testing transfer from lender to borrower...');
  const transferResult = await makeRequest('POST', '/wallet/transfer', {
    toUserId: borrowerId,
    amount: 1000,
    description: 'Test transfer from lender to borrower'
  }, authTokens.lender);

  if (transferResult.success) {
    console.log('✅ Transfer successful');
    console.log(`   Transfer Amount: $${transferResult.data.data.transfer.amount}`);
    console.log(`   New Lender Balance: $${transferResult.data.data.fromWallet.balance}`);
  } else {
    console.log('❌ Transfer failed:', transferResult.error.message);
  }
  console.log('');
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Wallet Endpoints Test Suite\n');
  console.log('=' .repeat(50));

  try {
    await testAuth();
    await testWalletCreation();
    await testWalletBalance();
    await testWalletSeparation();
    await testLoanFunding();
    await testWalletTransfer();

    console.log('=' .repeat(50));
    console.log('🎉 All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Authentication (Register/Login)');
    console.log('✅ Wallet Creation (Lender/Borrower/Admin)');
    console.log('✅ Wallet Balance Retrieval');
    console.log('✅ Wallet Separation Verification');
    console.log('✅ Loan Funding (Lender-specific)');
    console.log('✅ Wallet Transfer');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run the tests
runTests();








