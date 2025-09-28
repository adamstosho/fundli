// Test script to verify transfer notifications work
// This script simulates a wallet transfer and checks if notifications are created

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  lender: {
    email: 'lender@test.com',
    password: 'password123'
  },
  borrower: {
    email: 'borrower@test.com', 
    password: 'password123'
  },
  transferAmount: 100.00,
  description: 'This is a test transfer to verify that the lender\'s note appears in the borrower\'s notification. Thank you for testing!'
};

async function testTransferNotification() {
  try {
    console.log('🧪 Testing Transfer Notification System...\n');

    // Step 1: Login as lender
    console.log('1. Logging in as lender...');
    const lenderLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testData.lender.email,
      password: testData.lender.password
    });
    
    if (!lenderLoginResponse.data.success) {
      throw new Error('Lender login failed');
    }
    
    const lenderToken = lenderLoginResponse.data.data.accessToken;
    const lenderId = lenderLoginResponse.data.data.user.id;
    console.log('✅ Lender logged in successfully');

    // Step 2: Login as borrower
    console.log('2. Logging in as borrower...');
    const borrowerLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testData.borrower.email,
      password: testData.borrower.password
    });
    
    if (!borrowerLoginResponse.data.success) {
      throw new Error('Borrower login failed');
    }
    
    const borrowerToken = borrowerLoginResponse.data.data.accessToken;
    const borrowerId = borrowerLoginResponse.data.data.user.id;
    console.log('✅ Borrower logged in successfully');

    // Step 3: Get initial wallet balances
    console.log('3. Getting initial wallet balances...');
    const lenderWalletResponse = await axios.get(`${API_BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    const borrowerWalletResponse = await axios.get(`${API_BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const initialLenderBalance = lenderWalletResponse.data.data.balance;
    const initialBorrowerBalance = borrowerWalletResponse.data.data.balance;
    console.log(`💰 Initial balances - Lender: $${initialLenderBalance}, Borrower: $${initialBorrowerBalance}`);

    // Step 4: Perform transfer
    console.log('4. Performing wallet transfer...');
    const transferResponse = await axios.post(`${API_BASE_URL}/wallet/transfer`, {
      toUserId: borrowerId,
      amount: testData.transferAmount,
      description: testData.description
    }, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    
    if (!transferResponse.data.status === 'success') {
      throw new Error('Transfer failed');
    }
    
    console.log('✅ Transfer completed successfully');
    console.log(`📊 Transfer Reference: ${transferResponse.data.data.transfer.reference}`);

    // Step 5: Wait a moment for notifications to be created
    console.log('5. Waiting for notifications to be created...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Check notifications for borrower
    console.log('6. Checking borrower notifications...');
    const borrowerNotificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const borrowerNotifications = borrowerNotificationsResponse.data.data.notifications || [];
    const moneyReceivedNotification = borrowerNotifications.find(n => n.type === 'money_received');
    
    if (moneyReceivedNotification) {
      console.log('✅ Borrower received money_received notification');
      console.log(`📝 Title: ${moneyReceivedNotification.title}`);
      console.log(`💬 Message: ${moneyReceivedNotification.message}`);
      
      // Check if description is included
      if (moneyReceivedNotification.content && moneyReceivedNotification.content.includes(testData.description)) {
        console.log('✅ Lender\'s note is included in the notification content');
      } else {
        console.log('❌ Lender\'s note is missing from the notification content');
      }
    } else {
      console.log('❌ Borrower did not receive money_received notification');
    }

    // Step 7: Check notifications for lender
    console.log('7. Checking lender notifications...');
    const lenderNotificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    
    const lenderNotifications = lenderNotificationsResponse.data.data.notifications || [];
    const moneySentNotification = lenderNotifications.find(n => n.type === 'money_sent');
    
    if (moneySentNotification) {
      console.log('✅ Lender received money_sent notification');
      console.log(`📝 Title: ${moneySentNotification.title}`);
      console.log(`💬 Message: ${moneySentNotification.message}`);
      
      // Check if description is included
      if (moneySentNotification.content && moneySentNotification.content.includes(testData.description)) {
        console.log('✅ Lender\'s note is included in their own notification');
      } else {
        console.log('❌ Lender\'s note is missing from their own notification');
      }
    } else {
      console.log('❌ Lender did not receive money_sent notification');
    }

    // Step 8: Verify final balances
    console.log('8. Verifying final wallet balances...');
    const finalLenderWalletResponse = await axios.get(`${API_BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    const finalBorrowerWalletResponse = await axios.get(`${API_BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const finalLenderBalance = finalLenderWalletResponse.data.data.balance;
    const finalBorrowerBalance = finalBorrowerWalletResponse.data.data.balance;
    
    console.log(`💰 Final balances - Lender: $${finalLenderBalance}, Borrower: $${finalBorrowerBalance}`);
    
    const expectedLenderBalance = initialLenderBalance - testData.transferAmount;
    const expectedBorrowerBalance = initialBorrowerBalance + testData.transferAmount;
    
    if (Math.abs(finalLenderBalance - expectedLenderBalance) < 0.01 && 
        Math.abs(finalBorrowerBalance - expectedBorrowerBalance) < 0.01) {
      console.log('✅ Wallet balances are correct');
    } else {
      console.log('❌ Wallet balances are incorrect');
    }

    console.log('\n🎉 Transfer notification test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`- Transfer Amount: $${testData.transferAmount}`);
    console.log(`- Transfer Description: "${testData.description}"`);
    console.log(`- Borrower Notification: ${moneyReceivedNotification ? '✅ Created' : '❌ Missing'}`);
    console.log(`- Lender Notification: ${moneySentNotification ? '✅ Created' : '❌ Missing'}`);
    console.log(`- Description in Borrower Notification: ${moneyReceivedNotification && moneyReceivedNotification.content && moneyReceivedNotification.content.includes(testData.description) ? '✅ Included' : '❌ Missing'}`);
    console.log(`- Description in Lender Notification: ${moneySentNotification && moneySentNotification.content && moneySentNotification.content.includes(testData.description) ? '✅ Included' : '❌ Missing'}`);
    console.log(`- Wallet Balances: ${Math.abs(finalLenderBalance - expectedLenderBalance) < 0.01 ? '✅ Correct' : '❌ Incorrect'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTransferNotification();
