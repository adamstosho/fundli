const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testPaystackStatus() {
  console.log('🔍 Testing Paystack Service Status...\n');

  try {
    // Test 1: Check service status endpoint
    console.log('1️⃣ Testing service status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/api/borrower/kyc/status`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Service status response:', statusResponse.data);
    console.log('Can proceed with KYC:', statusResponse.data.data.canProceed);
    console.log('Estimated recovery time:', statusResponse.data.data.estimatedRecovery);
    console.log('Contact info:', statusResponse.data.data.contact);
    console.log('');

  } catch (error) {
    console.error('❌ Service status test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }

  try {
    // Test 2: Test BVN verification with a test BVN
    console.log('2️⃣ Testing BVN verification...');
    const bvnResponse = await axios.post(`${BASE_URL}/api/borrower/kyc`, {
      bvn: '12345678901',
      accountNumber: '1234567890',
      bankCode: '044'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ BVN verification response:', bvnResponse.data);
    console.log('');

  } catch (error) {
    console.log('📡 BVN verification test result:', {
      status: error.response?.status,
      errorCode: error.response?.data?.errorCode,
      message: error.response?.data?.message,
      retryAfter: error.response?.data?.retryAfter,
      suggestion: error.response?.data?.suggestion
    });

    if (error.response?.status === 503) {
      console.log('🔄 This is a service unavailability error (503)');
      console.log('💡 The enhanced error handling is working correctly');
    }
    console.log('');
  }

  try {
    // Test 3: Test direct Paystack service
    console.log('3️⃣ Testing direct Paystack service...');
    const PaystackService = require('./src/services/paystackService');
    
    const serviceStatus = await PaystackService.checkServiceStatus();
    console.log('✅ Direct service status:', serviceStatus);
    
    if (serviceStatus.success) {
      console.log('🟢 Paystack services are operational');
    } else {
      console.log('🔴 Paystack services have issues:', serviceStatus.message);
      console.log('Error code:', serviceStatus.errorCode);
      console.log('Estimated recovery:', serviceStatus.estimatedRecovery);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Direct service test failed:', error.message);
  }

  console.log('🏁 Testing complete!');
}

// Run the test
if (require.main === module) {
  testPaystackStatus().catch(console.error);
}

module.exports = { testPaystackStatus };
