const axios = require('axios');

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

// Test the admin loan details endpoint
async function testLoanDetailsEndpoint() {
  console.log('🧪 Testing Admin Loan Details Endpoint...\n');

  // Mock admin token (you'll need to replace this with a real one)
  const mockAdminToken = 'mock-admin-token';
  
  const headers = {
    'Authorization': `Bearer ${mockAdminToken}`,
    'Content-Type': 'application/json'
  };

  // Test with a sample loan ID (you'll need to replace this with a real loan ID from your database)
  const testLoanId = '68c3f3e123456789abcdef01'; // Replace with actual loan ID
  
  try {
    console.log(`Testing loan details for ID: ${testLoanId}...`);
    
    const response = await axios({
      method: 'GET',
      url: `${BASE_URL}/admin/loan/${testLoanId}`,
      headers: headers,
      timeout: 10000
    });

    console.log(`✅ Loan Details: ${response.status} - ${response.data.status}`);
    console.log(`   Loan ID: ${response.data.data.loan.id}`);
    console.log(`   Borrower: ${response.data.data.loan.borrower.name}`);
    console.log(`   Amount: $${response.data.data.loan.loanAmount}`);
    console.log(`   Status: ${response.data.data.loan.status}`);
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Loan Details: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
      if (error.response.status === 500) {
        console.log(`   Error details:`, error.response.data);
      }
    } else if (error.request) {
      console.log(`❌ Loan Details: No response received - ${error.message}`);
    } else {
      console.log(`❌ Loan Details: Error - ${error.message}`);
    }
  }
}

// Test health endpoint first
async function testHealthEndpoint() {
  try {
    console.log('🏥 Testing Health Endpoint...');
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ Health: ${response.status} - ${response.data.status}`);
    console.log(`   Database: ${response.data.database}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Health endpoint failed: ${error.message}`);
    console.log('');
  }
}

// Run the tests
async function runTests() {
  await testHealthEndpoint();
  await testLoanDetailsEndpoint();
}

runTests().catch(console.error);
