// Test script to verify API endpoints
const testAPI = async () => {
  try {
    // Test with a mock token (you'll need to replace this with a real token)
    const token = 'your-actual-jwt-token-here';
    
    console.log('Testing API endpoints...');
    
    // Test investment stats endpoint
    const investmentStatsResponse = await fetch('http://localhost:5000/api/lender/investment-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Investment Stats Response:', investmentStatsResponse.status);
    if (investmentStatsResponse.ok) {
      const data = await investmentStatsResponse.json();
      console.log('Investment Stats Data:', data);
    }
    
    // Test funded loans endpoint
    const fundedLoansResponse = await fetch('http://localhost:5000/api/lender/funded-loans', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Funded Loans Response:', fundedLoansResponse.status);
    if (fundedLoansResponse.ok) {
      const data = await fundedLoansResponse.json();
      console.log('Funded Loans Data:', data);
    }
    
    // Test chart data endpoint
    const chartDataResponse = await fetch('http://localhost:5000/api/lender/dashboard-charts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Chart Data Response:', chartDataResponse.status);
    if (chartDataResponse.ok) {
      const data = await chartDataResponse.json();
      console.log('Chart Data:', data);
    }
    
    // Test pools endpoint
    const poolsResponse = await fetch('http://localhost:5000/api/pools/my-pools', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Pools Response:', poolsResponse.status);
    if (poolsResponse.ok) {
      const data = await poolsResponse.json();
      console.log('Pools Data:', data);
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
};

// Run the test
testAPI();

