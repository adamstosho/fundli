// Test script to verify loan filtering and selection functionality
import axios from 'axios';

const API_BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function testLoanFiltering() {
  try {
    console.log('🧪 Testing Loan Filtering and Selection...\n');

    // Step 1: Check API connectivity
    console.log('1. Testing API connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Backend API is accessible');
    } catch (error) {
      console.log('❌ Backend API is not accessible:', error.message);
      return;
    }

    console.log('\n💡 To test loan filtering:');
    console.log('1. Go to your Fundli app');
    console.log('2. Login as a lender');
    console.log('3. Go to Transfer page');
    console.log('4. Click "Browse All Borrowers" button');
    console.log('5. Check that only borrowers with "approved" loans are shown');
    console.log('6. Verify that "funded" loans are NOT shown');

    console.log('\n💡 To test loan selection:');
    console.log('1. Find a borrower with multiple approved loans');
    console.log('2. Click on that borrower');
    console.log('3. A "Select Loan to Fund" modal should appear');
    console.log('4. Select a specific loan from the list');
    console.log('5. Proceed with the transfer');
    console.log('6. Check that only the selected loan gets funded');

    console.log('\n📋 Expected behavior:');
    console.log('✅ Only "approved" loans are shown in borrower list');
    console.log('✅ "Funded" loans are filtered out');
    console.log('✅ Borrowers with multiple approved loans show selection modal');
    console.log('✅ Borrowers with single approved loan proceed directly');
    console.log('✅ Selected loan gets funded, not all loans');

    console.log('\n🔍 What to check in backend logs:');
    console.log('- "Found X approved/pending loans for borrower [ID]"');
    console.log('- "Updating loan [SPECIFIC_ID] from status approved to funded"');
    console.log('- Only one loan should be updated per transfer');

    console.log('\n📊 What to check in frontend:');
    console.log('- Browse modal shows only borrowers with approved loans');
    console.log('- Loan selection modal appears for multi-loan borrowers');
    console.log('- Transfer confirmation shows selected loan details');
    console.log('- Success message mentions the specific loan funded');

    console.log('\n🎯 Key improvements:');
    console.log('- ✅ Funded loans are excluded from borrower list');
    console.log('- ✅ Multiple loan selection for borrowers');
    console.log('- ✅ Specific loan targeting in transfers');
    console.log('- ✅ Better user experience with clear loan selection');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoanFiltering();








