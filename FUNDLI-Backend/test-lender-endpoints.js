const axios = require('axios');

async function testLenderEndpoints() {
  try {
    console.log('🔍 Testing lender endpoints...');
    
    // Test if server is running
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }
    
    // Test lender loan applications endpoint
    try {
      console.log('🔍 Testing /api/lender/loan-applications...');
      const response = await axios.get('http://localhost:5000/api/lender/loan-applications', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Loan applications response:', response.status);
      console.log('📊 Data:', response.data);
    } catch (error) {
      console.log('❌ Loan applications error:', error.response?.status, error.response?.data);
    }
    
    // Test lender notifications endpoint
    try {
      console.log('🔍 Testing /api/lender/notifications...');
      const response = await axios.get('http://localhost:5000/api/lender/notifications', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Notifications response:', response.status);
      console.log('📊 Data:', response.data);
    } catch (error) {
      console.log('❌ Notifications error:', error.response?.status, error.response?.data);
    }
    
    // Test admin loans endpoint
    try {
      console.log('🔍 Testing /api/admin/loans...');
      const response = await axios.get('http://localhost:5000/api/admin/loans', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Admin loans response:', response.status);
      console.log('📊 Data:', response.data);
    } catch (error) {
      console.log('❌ Admin loans error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLenderEndpoints();


