require('dotenv').config();
const axios = require('axios');

console.log('🧪 Simple KYC Test Script');
console.log('==========================');
console.log('');

// Check environment
console.log('1️⃣ Environment Check:');
console.log('PAYSTACK_SECRET_KEY:', process.env.PAYSTACK_SECRET_KEY ? '✅ SET' : '❌ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');
console.log('');

// Test data
const testData = {
  bvn: '12345678901',
  accountNumber: '1234567890',
  bankCode: '044'
};

console.log('2️⃣ Test Data:');
console.log('BVN:', testData.bvn);
console.log('Account Number:', testData.accountNumber);
console.log('Bank Code:', testData.bankCode);
console.log('');

// Test direct Paystack connection
async function testPaystackDirect() {
  console.log('3️⃣ Testing Paystack Direct Connection...');
  
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.log('❌ No Paystack key found');
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
    console.log('Status:', response.data.status);
    console.log('Banks count:', response.data.data?.length || 0);
    
  } catch (error) {
    console.log('❌ Paystack connection failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.message || error.message);
  }
  console.log('');
}

// Test backend KYC endpoint
async function testBackendKYC() {
  console.log('4️⃣ Testing Backend KYC Endpoint...');
  
  try {
    const response = await axios.post('https://fundli-hjqn.vercel.app/api/borrower/kyc', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Backend KYC test successful');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Backend KYC test failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');
}

// Run tests
async function runTests() {
  await testPaystackDirect();
  await testBackendKYC();
  
  console.log('✨ Tests completed!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Check if PAYSTACK_SECRET_KEY is set in .env file');
  console.log('2. Verify the API key is valid');
  console.log('3. Check backend server logs for detailed errors');
}

runTests().catch(console.error);
