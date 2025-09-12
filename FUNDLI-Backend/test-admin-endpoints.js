const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test function to check admin endpoints
async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Endpoints...\n');

  // You'll need to replace this with a valid admin token
  const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
  
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    {
      name: 'Collateral Admin - Pending',
      url: `${BASE_URL}/collateral/admin/pending`,
      method: 'GET'
    },
    {
      name: 'Collateral Admin - Approved',
      url: `${BASE_URL}/collateral/admin/approved`,
      method: 'GET'
    },
    {
      name: 'Collateral Admin - Deleted',
      url: `${BASE_URL}/collateral/admin/deleted`,
      method: 'GET'
    },
    {
      name: 'Admin Loan Applications',
      url: `${BASE_URL}/admin/loan-applications?status=all`,
      method: 'GET'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        headers: headers,
        timeout: 10000
      });

      console.log(`✅ ${endpoint.name}: ${response.status} - ${response.data.status}`);
      
      if (response.data.data) {
        const dataKeys = Object.keys(response.data.data);
        console.log(`   Data keys: ${dataKeys.join(', ')}`);
        
        if (response.data.data.verifications) {
          console.log(`   Verifications count: ${response.data.data.verifications.length}`);
        }
        if (response.data.data.loanApplications) {
          console.log(`   Loan applications count: ${response.data.data.loanApplications.length}`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint.name}: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        console.log(`❌ ${endpoint.name}: No response received - ${error.message}`);
      } else {
        console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

// Instructions for running the test
console.log('📋 Admin Endpoint Test Instructions:');
console.log('1. Make sure your backend server is running on http://localhost:5000');
console.log('2. Replace "YOUR_ADMIN_TOKEN_HERE" with a valid admin JWT token');
console.log('3. Run: node test-admin-endpoints.js');
console.log('4. Check the results below\n');

// Run the test
testAdminEndpoints().catch(console.error);
