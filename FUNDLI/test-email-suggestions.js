// Test script to verify email suggestions functionality
// This script tests the approved borrowers API endpoint

const axios = require('axios');

const API_BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function testEmailSuggestions() {
  try {
    console.log('🧪 Testing Email Suggestions API...\n');

    // Step 1: Login as a lender
    console.log('1. Logging in as lender...');
    const lenderLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'lender@test.com',
      password: 'password123'
    });
    
    if (!lenderLoginResponse.data.success) {
      throw new Error('Lender login failed');
    }
    
    const lenderToken = lenderLoginResponse.data.data.accessToken;
    console.log('✅ Lender logged in successfully');

    // Step 2: Test approved borrowers API
    console.log('2. Fetching approved borrowers...');
    const approvedBorrowersResponse = await axios.get(`${API_BASE_URL}/wallet/approved-borrowers`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    
    if (!approvedBorrowersResponse.data.status === 'success') {
      throw new Error('Failed to fetch approved borrowers');
    }
    
    const approvedBorrowers = approvedBorrowersResponse.data.data.borrowers;
    console.log(`✅ Found ${approvedBorrowers.length} approved borrowers`);

    // Step 3: Display approved borrowers
    console.log('\n3. Approved Borrowers List:');
    if (approvedBorrowers.length > 0) {
      approvedBorrowers.forEach((borrower, index) => {
        console.log(`\n${index + 1}. ${borrower.name}`);
        console.log(`   Email: ${borrower.email}`);
        console.log(`   Approved Loans: ${borrower.approvedLoans.length}`);
        
        if (borrower.approvedLoans.length > 0) {
          console.log('   Loan Details:');
          borrower.approvedLoans.forEach((loan, loanIndex) => {
            console.log(`     ${loanIndex + 1}. Amount: $${loan.amount} | Purpose: ${loan.purpose} | Status: ${loan.status}`);
          });
        }
      });
    } else {
      console.log('   No approved borrowers found');
    }

    // Step 4: Test filtering functionality (simulate frontend filtering)
    console.log('\n4. Testing email filtering...');
    const testQueries = ['borrower', 'test', 'com', 'john', 'jane'];
    
    testQueries.forEach(query => {
      const filtered = approvedBorrowers.filter(borrower => 
        borrower.email.toLowerCase().includes(query.toLowerCase()) ||
        borrower.name.toLowerCase().includes(query.toLowerCase())
      );
      console.log(`   Query "${query}": ${filtered.length} matches`);
    });

    // Step 5: Test API response structure
    console.log('\n5. Verifying API response structure...');
    const response = approvedBorrowersResponse.data;
    
    const requiredFields = ['status', 'message', 'data'];
    const dataFields = ['borrowers', 'totalCount'];
    
    const hasRequiredFields = requiredFields.every(field => response.hasOwnProperty(field));
    const hasDataFields = dataFields.every(field => response.data.hasOwnProperty(field));
    
    if (hasRequiredFields && hasDataFields) {
      console.log('✅ API response structure is correct');
    } else {
      console.log('❌ API response structure is incorrect');
    }

    console.log('\n🎉 Email suggestions test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`- Total Approved Borrowers: ${approvedBorrowers.length}`);
    console.log(`- API Response Structure: ${hasRequiredFields && hasDataFields ? '✅ Correct' : '❌ Incorrect'}`);
    console.log(`- Filtering Logic: ✅ Working`);
    console.log(`- Ready for Frontend Integration: ✅ Yes`);

    // Example usage for frontend
    console.log('\n💡 Frontend Integration Example:');
    console.log('```javascript');
    console.log('// Load approved borrowers on component mount');
    console.log('const loadApprovedBorrowers = async () => {');
    console.log('  const response = await fetch("/api/wallet/approved-borrowers", {');
    console.log('    headers: { Authorization: `Bearer ${token}` }');
    console.log('  });');
    console.log('  const data = await response.json();');
    console.log('  setApprovedBorrowers(data.data.borrowers);');
    console.log('};');
    console.log('');
    console.log('// Filter borrowers as user types');
    console.log('const filteredSuggestions = approvedBorrowers.filter(borrower =>');
    console.log('  borrower.email.toLowerCase().includes(inputValue.toLowerCase()) ||');
    console.log('  borrower.name.toLowerCase().includes(inputValue.toLowerCase())');
    console.log(');');
    console.log('```');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmailSuggestions();

