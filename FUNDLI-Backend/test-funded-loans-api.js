const axios = require('axios');

async function testFundedLoansAPI() {
  try {
    console.log('🔍 Testing funded loans API...');
    
    // First, let's try to login as a lender
    const loginResponse = await axios.post('https://fundli-hjqn.vercel.app/api/auth/login', {
      email: 'lender@test.com',
      password: 'TestPassword123!'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // Now test the funded loans endpoint
    const fundedLoansResponse = await axios.get('https://fundli-hjqn.vercel.app/api/lender/funded-loans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Funded loans API response:');
    console.log('Status:', fundedLoansResponse.status);
    console.log('Data:', JSON.stringify(fundedLoansResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testFundedLoansAPI();





