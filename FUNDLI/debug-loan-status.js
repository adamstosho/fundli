// Debug script to check loan status update
import axios from 'axios';

const API_BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function debugLoanStatus() {
  try {
    console.log('🔍 Debugging Loan Status Update...\n');

    // Step 1: Check if we can access the API
    console.log('1. Testing API connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Backend API is accessible');
    } catch (error) {
      console.log('❌ Backend API is not accessible:', error.message);
      return;
    }

    // Step 2: Try to get some sample data
    console.log('\n2. Testing with sample data...');
    
    // Let's try to see what users exist
    console.log('💡 To test the loan status update:');
    console.log('1. Make sure you have a borrower with an approved loan');
    console.log('2. Transfer money to that borrower');
    console.log('3. Check the backend console logs for loan update messages');
    console.log('4. Check the loan status in the frontend');

    console.log('\n📋 Expected behavior:');
    console.log('- When you transfer money to a borrower with approved/pending loans');
    console.log('- The system should log: "Checking for loans for borrower: [ID]"');
    console.log('- If loans found: "Found X approved/pending loans for borrower [ID]"');
    console.log('- If updating: "Updating loan [ID] from status [old] to funded"');
    console.log('- Success: "Loan [ID] status updated to funded for borrower [ID]"');

    console.log('\n🔧 To test manually:');
    console.log('1. Go to your Fundli app');
    console.log('2. Login as a lender');
    console.log('3. Go to Transfer page');
    console.log('4. Select a borrower who has approved loans');
    console.log('5. Transfer money to them');
    console.log('6. Check the backend console for the debug messages above');

    console.log('\n📊 What to look for in backend logs:');
    console.log('- Transfer recipient: [Name] ([userType])');
    console.log('- Checking for loans for borrower: [ID]');
    console.log('- Found X approved/pending loans for borrower [ID]');
    console.log('- Updating loan [ID] from status [old] to funded');
    console.log('- Loan [ID] status updated to funded for borrower [ID]');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLoanStatus();









