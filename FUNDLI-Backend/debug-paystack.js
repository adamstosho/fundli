require('dotenv').config();
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Test data
const TEST_DATA = {
  bvn: '12345678901', // Replace with real test BVN
  accountNumber: '1234567890', // Replace with real test account
  bankCode: '044' // Replace with real bank code (044 = Access Bank)
};

console.log('🔧 Paystack Integration Debug Script');
console.log('=====================================');
console.log('');

// Test 1: Check environment variables
console.log('1️⃣ Checking Environment Variables...');
console.log('PAYSTACK_SECRET_KEY:', process.env.PAYSTACK_SECRET_KEY ? 
  process.env.PAYSTACK_SECRET_KEY.substring(0, 10) + '...' : '❌ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');
console.log('');

// Test 2: Test Paystack connection directly
async function testPaystackDirect() {
  console.log('2️⃣ Testing Paystack Connection Directly...');
  
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.log('❌ Cannot test Paystack without API key');
    return;
  }

  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Paystack connection successful');
    console.log('Response status:', response.data.status);
    console.log('Banks count:', response.data.data?.length || 0);
    
  } catch (error) {
    console.log('❌ Paystack connection failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
  console.log('');
}

// Test 3: Test backend Paystack endpoint
async function testBackendPaystack() {
  console.log('3️⃣ Testing Backend Paystack Endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/borrower/test-paystack`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      timeout: 10000
    });

    console.log('✅ Backend Paystack test successful');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Backend Paystack test failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
  console.log('');
}

// Test 4: Test BVN verification
async function testBVNVerification() {
  console.log('4️⃣ Testing BVN Verification...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/borrower/kyc`, {
      bvn: TEST_DATA.bvn,
      accountNumber: TEST_DATA.accountNumber,
      bankCode: TEST_DATA.bankCode
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ BVN verification successful');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ BVN verification failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
  console.log('');
}

// Test 5: Test bank account verification
async function testBankVerification() {
  console.log('5️⃣ Testing Bank Account Verification...');
  
  try {
    const response = await axios.get('https://api.paystack.co/bank/resolve', {
      params: {
        account_number: TEST_DATA.accountNumber,
        bank_code: TEST_DATA.bankCode
      },
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Bank verification successful');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Bank verification failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
  console.log('');
}

// Test 6: Test banks list
async function testBanksList() {
  console.log('6️⃣ Testing Banks List...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/borrower/banks`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      timeout: 10000
    });

    console.log('✅ Banks list successful');
    console.log('Banks count:', response.data.data?.banks?.length || 0);
    
  } catch (error) {
    console.log('❌ Banks list failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Paystack Integration Tests...\n');
  
  await testPaystackDirect();
  await testBackendPaystack();
  await testBVNVerification();
  await testBankVerification();
  await testBanksList();
  
  console.log('✨ All tests completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('- Check if PAYSTACK_SECRET_KEY is set in .env file');
  console.log('- Verify the API key is valid and active');
  console.log('- Ensure you have sufficient Paystack credits');
  console.log('- Check if the API endpoints are accessible');
}

// Run if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testPaystackDirect,
  testBackendPaystack,
  testBVNVerification,
  testBankVerification,
  testBanksList
};
