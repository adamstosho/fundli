const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test the collateral endpoints with a mock admin token
async function testCollateralEndpointsWithAuth() {
  console.log('🧪 Testing Collateral Endpoints With Mock Auth...\n');

  // Mock admin token (you'll need to replace this with a real one)
  const mockAdminToken = 'mock-admin-token';
  
  const headers = {
    'Authorization': `Bearer ${mockAdminToken}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    {
      name: 'Collateral Admin - Pending',
      url: `${BASE_URL}/collateral/admin/pending`,
      method: 'GET',
      headers: headers
    },
    {
      name: 'Collateral Admin - Approved',
      url: `${BASE_URL}/collateral/admin/approved`,
      method: 'GET',
      headers: headers
    },
    {
      name: 'Collateral Admin - Deleted',
      url: `${BASE_URL}/collateral/admin/deleted`,
      method: 'GET',
      headers: headers
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        timeout: 5000
      });

      console.log(`✅ ${endpoint.name}: ${response.status} - ${response.data.status}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint.name}: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
        if (error.response.status === 500) {
          console.log(`   Error details:`, error.response.data);
        }
      } else if (error.request) {
        console.log(`❌ ${endpoint.name}: No response received - ${error.message}`);
      } else {
        console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
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
  await testCollateralEndpointsWithAuth();
}

runTests().catch(console.error);
