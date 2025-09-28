const axios = require('axios');

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

// Test the loan funding endpoint with detailed error logging
const testLoanFundingEndpoint = async () => {
  try {
    console.log('🔍 Testing Loan Funding Endpoint\n');

    const loanId = '68c425a724713b758ade7993';
    const testData = {
      investmentAmount: 1000,
      notes: 'Test funding'
    };

    console.log(`📝 Testing loan funding for ID: ${loanId}`);
    console.log(`💰 Investment amount: $${testData.investmentAmount}`);

    // Test without authentication first to see the error
    console.log('\n🔍 Step 1: Testing without authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/lender/loan/${loanId}/accept`, testData);
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error (expected):', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test with mock authentication
    console.log('\n🔍 Step 2: Testing with mock authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/lender/loan/${loanId}/accept`, testData, {
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

    // Test loan existence
    console.log('\n🔍 Step 3: Testing if loan exists...');
    try {
      const response = await axios.get(`${BASE_URL}/loans/${loanId}`);
      console.log('✅ Loan exists:', response.data);
    } catch (error) {
      console.log('❌ Loan not found:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test lender wallet endpoint
    console.log('\n🔍 Step 4: Testing lender wallet endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/lender/wallet/balance`, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      console.log('✅ Wallet endpoint works:', response.data);
    } catch (error) {
      console.log('❌ Wallet error:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testLoanFundingEndpoint();
