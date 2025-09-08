require('dotenv').config();
const axios = require('axios');

// Test card payment initialization
const testCardPayment = async () => {
  try {
    console.log('🧪 Testing Card Payment Initialization...\n');

    // Test data
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+2341234567890',
      userType: 'borrower'
    };

    // Step 1: Register and login
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log('✅ User registered');

    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: Create wallet
    console.log('\n3️⃣ Creating wallet...');
    const createWalletResponse = await axios.post('http://localhost:5000/api/wallet/create', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Wallet created');

    // Step 3: Test card payment initialization
    console.log('\n4️⃣ Testing card payment initialization...');
    try {
      const depositResponse = await axios.post('http://localhost:5000/api/wallet/deposit', {
        amount: 1000,
        currency: 'NGN',
        paymentMethod: 'card'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Card payment initialized successfully');
      console.log('📊 Response data:', depositResponse.data.data);
      
      if (depositResponse.data.data.publicKey) {
        console.log('✅ Paystack public key found:', depositResponse.data.data.publicKey.substring(0, 20) + '...');
      } else {
        console.log('❌ No Paystack public key in response');
      }
      
    } catch (error) {
      console.log('❌ Card payment initialization failed');
      console.log('📊 Error details:', error.response?.data || error.message);
      
      if (error.response?.data?.message?.includes('Payment service not configured')) {
        console.log('💡 Issue: Paystack API keys not configured');
        console.log('💡 Solution: Add PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY to .env file');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Run the test
testCardPayment();
