const axios = require('axios');

async function testLoginAndEndpoints() {
  try {
    console.log('🔍 Testing login and endpoints...');
    
    // First, try to login with a test user
    let token = null;
    
    // Try to login with test lender
    try {
      console.log('🔐 Attempting login with test lender...');
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'lender@test.com',
        password: 'TestPassword123!'
      });
      
      token = loginResponse.data.accessToken;
      console.log('✅ Login successful! Token:', token ? 'Received' : 'Not received');
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data || loginError.message);
      
      // Try to create a test lender first
      try {
        console.log('👤 Creating test lender...');
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
          firstName: 'Test',
          lastName: 'Lender',
          email: 'lender@test.com',
          phone: '+1234567890',
          password: 'TestPassword123!',
          userType: 'lender'
        });
        
        console.log('✅ Test lender created!');
        token = registerResponse.data.accessToken;
      } catch (registerError) {
        console.log('❌ Registration failed:', registerError.response?.data || registerError.message);
        return;
      }
    }
    
    if (!token) {
      console.log('❌ No token available, cannot test endpoints');
      return;
    }
    
    // Test lender loan applications endpoint
    try {
      console.log('🔍 Testing /api/lender/loan-applications...');
      const response = await axios.get('http://localhost:5000/api/lender/loan-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Loan applications response:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Loan applications error:', error.response?.status, error.response?.data);
    }
    
    // Test lender notifications endpoint
    try {
      console.log('🔍 Testing /api/lender/notifications...');
      const response = await axios.get('http://localhost:5000/api/lender/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Notifications response:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Notifications error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginAndEndpoints();












