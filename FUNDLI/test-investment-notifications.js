// Test script to verify investment notifications
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testInvestmentNotifications() {
  try {
    console.log('🧪 Testing Investment Notifications...\n');

    // Step 1: Check API connectivity
    console.log('1. Testing API connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Backend API is accessible');
    } catch (error) {
      console.log('❌ Backend API is not accessible:', error.message);
      return;
    }

    console.log('\n💡 To test investment notifications:');
    console.log('1. Go to your Fundli app');
    console.log('2. Login as a lender');
    console.log('3. Find a loan application with status "approved"');
    console.log('4. Click "Invest in Loan"');
    console.log('5. Enter an investment amount');
    console.log('6. Add optional investment notes');
    console.log('7. Click "Invest"');
    console.log('8. Check notifications for both lender and borrower');

    console.log('\n📋 Expected notifications:');
    console.log('👤 Borrower should receive:');
    console.log('   - Title: "🎉 Loan Funding Received!"');
    console.log('   - Type: "loan_funded"');
    console.log('   - Content: Investment details, funding progress, new wallet balance');
    console.log('   - Priority: High');
    console.log('   - Action: View Dashboard');

    console.log('\n👤 Lender should receive:');
    console.log('   - Title: "✅ Investment Successful!"');
    console.log('   - Type: "investment_successful"');
    console.log('   - Content: Investment details, borrower info, remaining balance');
    console.log('   - Priority: Normal');
    console.log('   - Action: View Investments');

    console.log('\n🔍 What to check in backend logs:');
    console.log('- "📧 Notifications sent to borrower and lender for investment [REFERENCE]"');
    console.log('- No notification errors');

    console.log('\n📊 What to check in frontend:');
    console.log('- Borrower sees notification toast');
    console.log('- Lender sees notification toast');
    console.log('- Both notifications appear in notification center');
    console.log('- Notifications have correct icons and colors');

    console.log('\n🎯 Key features:');
    console.log('- Investment notes are included in notifications');
    console.log('- Funding progress percentage is shown');
    console.log('- Wallet balances are updated');
    console.log('- Loan status changes to "funded" if fully funded');
    console.log('- Rich metadata for tracking');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInvestmentNotifications();








