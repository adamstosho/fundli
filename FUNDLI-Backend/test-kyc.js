const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Test functions
async function testAvailableLoans() {
  try {
    console.log('Testing GET /api/borrower/available-loans...');
    
    const response = await axios.get(`${BASE_URL}/api/borrower/available-loans`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ Available loans endpoint working');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Available loans endpoint failed:', error.response?.data || error.message);
  }
}

async function testKYCSubmission() {
  try {
    console.log('\nTesting POST /api/borrower/kyc...');
    
    const kycData = {
      bvn: '12345678901',
      accountNumber: '1234567890',
      bankCode: '044'
    };
    
    const response = await axios.post(`${BASE_URL}/api/borrower/kyc`, kycData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ KYC submission endpoint working');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ KYC submission endpoint failed:', error.response?.data || error.message);
  }
}

async function testLoanApplication() {
  try {
    console.log('\nTesting POST /api/borrower/loan/:id/apply...');
    
    const loanData = {
      requestedAmount: 5000,
      purpose: 'business',
      duration: 12,
      collateral: 'Business equipment'
    };
    
    // You'll need to replace 'loan-id-here' with an actual loan ID
    const response = await axios.post(`${BASE_URL}/api/borrower/loan/loan-id-here/apply`, loanData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Loan application endpoint working');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Loan application endpoint failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing KYC and Loan Application Endpoints\n');
  
  await testAvailableLoans();
  await testKYCSubmission();
  await testLoanApplication();
  
  console.log('\n✨ Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAvailableLoans,
  testKYCSubmission,
  testLoanApplication
};
