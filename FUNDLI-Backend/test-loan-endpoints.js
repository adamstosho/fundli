const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test the loan details and approval endpoints
async function testLoanEndpoints() {
  console.log('🧪 Testing Loan Endpoints...\n');

  // Mock admin token (you'll need to replace this with a real one)
  const mockAdminToken = 'mock-admin-token';
  
  const headers = {
    'Authorization': `Bearer ${mockAdminToken}`,
    'Content-Type': 'application/json'
  };

  // First, let's get a list of loans to find a real loan ID
  try {
    console.log('Getting loan applications list...');
    const loansResponse = await axios.get(`${BASE_URL}/admin/loan-applications?status=all`, { headers });
    
    if (loansResponse.data.data.loanApplications.length > 0) {
      const firstLoan = loansResponse.data.data.loanApplications[0];
      const loanId = firstLoan.id;
      
      console.log(`Found loan ID: ${loanId}`);
      console.log(`Borrower: ${firstLoan.borrower.name}`);
      console.log(`Amount: $${firstLoan.loanAmount}`);
      console.log(`Status: ${firstLoan.status}`);
      console.log('');
      
      // Test loan details endpoint
      console.log('Testing loan details endpoint...');
      try {
        const detailsResponse = await axios.get(`${BASE_URL}/admin/loan/${loanId}`, { headers });
        console.log(`✅ Loan Details: ${detailsResponse.status}`);
        console.log(`   Borrower Name: ${detailsResponse.data.data.loan.borrower.name}`);
        console.log(`   Borrower Email: ${detailsResponse.data.data.loan.borrower.email}`);
        console.log(`   Borrower Phone: ${detailsResponse.data.data.loan.borrower.phone}`);
        console.log(`   Loan Status: ${detailsResponse.data.data.loan.status}`);
      } catch (error) {
        console.log(`❌ Loan Details Error: ${error.response?.status} - ${error.response?.data?.message}`);
        if (error.response?.data?.details) {
          console.log(`   Details: ${error.response.data.details}`);
        }
      }
      
      console.log('');
      
      // Test approval endpoint (only if loan is pending)
      if (firstLoan.status === 'pending') {
        console.log('Testing loan approval endpoint...');
        try {
          const approveResponse = await axios.post(`${BASE_URL}/admin/loan/${loanId}/approve`, {
            action: 'approve',
            adminNotes: 'Test approval from script'
          }, { headers });
          console.log(`✅ Loan Approval: ${approveResponse.status} - ${approveResponse.data.message}`);
        } catch (error) {
          console.log(`❌ Loan Approval Error: ${error.response?.status} - ${error.response?.data?.message}`);
        }
      } else {
        console.log(`Skipping approval test - loan status is ${firstLoan.status}`);
      }
      
    } else {
      console.log('No loans found in the system');
    }
    
  } catch (error) {
    console.log(`❌ Failed to get loan applications: ${error.response?.status} - ${error.response?.data?.message}`);
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
  await testLoanEndpoints();
}

runTests().catch(console.error);
