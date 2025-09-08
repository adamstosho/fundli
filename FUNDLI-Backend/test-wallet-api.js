const axios = require('axios');

// Test wallet functionality
const testWalletAPI = async () => {
  try {
    console.log('🧪 Testing Wallet API...\n');

    // Test data
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+2341234567890',
      userType: 'borrower'
    };

    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log('✅ User registered:', registerResponse.data.data.user.email);

    // Step 2: Login to get token
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    // Step 3: Create wallet
    console.log('\n3️⃣ Creating wallet...');
    const createWalletResponse = await axios.post('http://localhost:5000/api/wallet/create', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Wallet created:', createWalletResponse.data.data.wallet);

    // Step 4: Get wallet details
    console.log('\n4️⃣ Getting wallet details...');
    const getWalletResponse = await axios.get('http://localhost:5000/api/wallet', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Wallet details:', {
      balance: getWalletResponse.data.data.wallet.balance,
      currency: getWalletResponse.data.data.wallet.currency,
      status: getWalletResponse.data.data.wallet.status
    });

    // Step 5: Test deposit (without actual payment)
    console.log('\n5️⃣ Testing deposit initialization...');
    try {
      const depositResponse = await axios.post('http://localhost:5000/api/wallet/deposit', {
        amount: 1000,
        currency: 'NGN'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Deposit initialized:', depositResponse.data.data);
    } catch (error) {
      console.log('⚠️ Deposit test failed (expected if Paystack keys not configured):', error.response?.data?.message || error.message);
    }

    // Step 6: Get wallet transactions
    console.log('\n6️⃣ Getting wallet transactions...');
    const transactionsResponse = await axios.get('http://localhost:5000/api/wallet/transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Transactions retrieved:', transactionsResponse.data.data.transactions.length, 'transactions');

    // Step 7: Get wallet stats
    console.log('\n7️⃣ Getting wallet stats...');
    const statsResponse = await axios.get('http://localhost:5000/api/wallet/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Wallet stats:', statsResponse.data.data.stats);

    console.log('\n🎉 All wallet API tests completed successfully!');

  } catch (error) {
    console.error('❌ Wallet API test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Authentication error - check if user is logged in');
    } else if (error.response?.status === 404) {
      console.log('💡 Wallet not found - try creating wallet first');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - make sure backend server is running on port 5000');
    }
  }
};

// Run the test
testWalletAPI();
