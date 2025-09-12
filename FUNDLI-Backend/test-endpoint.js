const fetch = require('node-fetch');

async function testLoanAcceptance() {
  try {
    console.log('Testing loan acceptance endpoint...');
    
    const loanId = '68c184e2e2a0e5fa25ece076';
    const url = `http://localhost:5000/api/lender/loan/${loanId}/accept`;
    
    const requestBody = {
      investmentAmount: 1000,
      notes: 'Test investment'
    };
    
    console.log('Making request to:', url);
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will likely fail auth, but we'll see the error
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLoanAcceptance();

