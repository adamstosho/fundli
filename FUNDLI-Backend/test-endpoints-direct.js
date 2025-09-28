const axios = require('axios');

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

// Test the collateral endpoints directly
async function testCollateralEndpoints() {
  console.log('🧪 Testing Collateral Endpoints Directly...\n');

  // Test without authentication first to see the error
  const endpoints = [
    {
      name: 'Collateral Admin - Pending (No Auth)',
      url: `${BASE_URL}/collateral/admin/pending`,
      method: 'GET',
      headers: {}
    },
    {
      name: 'Collateral Admin - Approved (No Auth)',
      url: `${BASE_URL}/collateral/admin/approved`,
      method: 'GET',
      headers: {}
    },
    {
      name: 'Collateral Admin - Deleted (No Auth)',
      url: `${BASE_URL}/collateral/admin/deleted`,
      method: 'GET',
      headers: {}
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

// Run the test
testCollateralEndpoints().catch(console.error);
