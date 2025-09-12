const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test the borrower loan application endpoint
const testLoanApplication = async () => {
  try {
    console.log('🔍 Testing Borrower Loan Application Endpoint\n');

    // Test data
    const testData = {
      loanAmount: 10000,
      purpose: 'business',
      duration: 12,
      collateral: 'Test collateral',
      description: 'Test loan application'
    };

    console.log('📝 Test data:', testData);

    // Test without authentication first
    console.log('\n🔍 Step 1: Testing without authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/borrower/loan/apply`, testData);
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error (expected):', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test with mock authentication
    console.log('\n🔍 Step 2: Testing with mock authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/borrower/loan/apply`, testData, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      
      if (error.response?.data?.error) {
        console.log('🔍 Detailed error:', error.response.data.error);
      }
    }

    // Test with minimal data
    console.log('\n🔍 Step 3: Testing with minimal data...');
    const minimalData = {
      loanAmount: 1000,
      purpose: 'test',
      duration: 6
    };

    try {
      const response = await axios.post(`${BASE_URL}/borrower/loan/apply`, minimalData, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      
      if (error.response?.data?.error) {
        console.log('🔍 Detailed error:', error.response.data.error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testLoanApplication();
