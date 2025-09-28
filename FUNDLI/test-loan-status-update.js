// Test script to verify loan status update when borrower receives payment
// This script tests the complete flow: loan application -> approval -> transfer -> loan status update

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
  admin: {
    email: 'admin@test.com',
    password: 'password123'
  },
  loanAmount: 5000,
  loanPurpose: 'business',
  transferAmount: 5000, // Full loan amount
  description: 'Funding your approved loan application'
};

async function testLoanStatusUpdate() {
  try {
    console.log('🧪 Testing Loan Status Update on Transfer...\n');

    // Step 1: Login as borrower
    console.log('1. Borrower logging in...');
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

    // Step 2: Borrower applies for a loan
    console.log('2. Borrower applying for a loan...');
    const loanApplicationResponse = await axios.post(`${API_BASE_URL}/loans/apply`, {
      borrower: borrowerId,
      loanAmount: testData.loanAmount,
      purpose: testData.loanPurpose,
      purposeDescription: 'Business expansion and equipment purchase',
      duration: 12, // months
      interestRate: 0.05,
      totalInterest: testData.loanAmount * 0.05,
      amountRemaining: testData.loanAmount + (testData.loanAmount * 0.05),
      collateral: {
        type: 'real_estate',
        description: 'Commercial property',
        estimatedValue: 150000
      }
    }, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    if (!loanApplicationResponse.data.success) {
      throw new Error('Loan application failed');
    }
    
    const loanId = loanApplicationResponse.data.data.loan.id;
    console.log(`✅ Loan application created with ID: ${loanId}`);

    // Step 3: Check initial loan status
    console.log('3. Checking initial loan status...');
    const initialLoanResponse = await axios.get(`${API_BASE_URL}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const initialLoanStatus = initialLoanResponse.data.data.loan.status;
    console.log(`Initial loan status: ${initialLoanStatus}`);

    // Step 4: Admin login and approve loan
    console.log('4. Admin logging in and approving loan...');
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    
    if (!adminLoginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    const adminToken = adminLoginResponse.data.data.accessToken;
    console.log('✅ Admin logged in successfully');

    // Approve the loan
    const approveResponse = await axios.post(`${API_BASE_URL}/admin/loan/${loanId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (!approveResponse.data.success) {
      throw new Error('Loan approval failed');
    }
    
    console.log('✅ Loan approved by admin');

    // Step 5: Check loan status after approval
    console.log('5. Checking loan status after approval...');
    const approvedLoanResponse = await axios.get(`${API_BASE_URL}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const approvedLoanStatus = approvedLoanResponse.data.data.loan.status;
    console.log(`Loan status after approval: ${approvedLoanStatus}`);

    // Step 6: Lender login
    console.log('6. Lender logging in...');
    const lenderLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testData.lender.email,
      password: testData.lender.password
    });
    
    if (!lenderLoginResponse.data.success) {
      throw new Error('Lender login failed');
    }
    
    const lenderToken = lenderLoginResponse.data.data.accessToken;
    console.log('✅ Lender logged in successfully');

    // Step 7: Lender transfers money to borrower
    console.log(`7. Lender transferring $${testData.transferAmount} to borrower...`);
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
    console.log(`Transfer reference: ${transferResponse.data.data.transfer.reference}`);
    
    // Check if loan was updated
    const loanUpdated = transferResponse.data.data.loanUpdated;
    console.log(`Loan updated: ${loanUpdated}`);
    
    if (loanUpdated) {
      const updatedLoanInfo = transferResponse.data.data.loan;
      console.log(`Updated loan status: ${updatedLoanInfo.status}`);
      console.log(`Updated loan amount: $${updatedLoanInfo.amount}`);
    }

    // Step 8: Verify loan status after transfer
    console.log('8. Verifying loan status after transfer...');
    const finalLoanResponse = await axios.get(`${API_BASE_URL}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const finalLoanStatus = finalLoanResponse.data.data.loan.status;
    const finalLoanData = finalLoanResponse.data.data.loan;
    
    console.log(`Final loan status: ${finalLoanStatus}`);
    console.log(`Funded amount: $${finalLoanData.fundingProgress?.fundedAmount || 0}`);
    console.log(`Number of investors: ${finalLoanData.fundingProgress?.investors?.length || 0}`);

    // Step 9: Check notifications
    console.log('9. Checking notifications...');
    
    // Check borrower notifications
    const borrowerNotificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const borrowerNotifications = borrowerNotificationsResponse.data.data.notifications || [];
    const moneyReceivedNotification = borrowerNotifications.find(n => n.type === 'money_received');
    
    if (moneyReceivedNotification) {
      console.log('✅ Borrower received money_received notification');
      console.log(`   Title: ${moneyReceivedNotification.title}`);
      console.log(`   Loan updated: ${moneyReceivedNotification.metadata?.loanUpdated || false}`);
    } else {
      console.log('❌ Borrower did not receive money_received notification');
    }

    // Check lender notifications
    const lenderNotificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });
    
    const lenderNotifications = lenderNotificationsResponse.data.data.notifications || [];
    const moneySentNotification = lenderNotifications.find(n => n.type === 'money_sent');
    
    if (moneySentNotification) {
      console.log('✅ Lender received money_sent notification');
      console.log(`   Title: ${moneySentNotification.title}`);
      console.log(`   Loan funded: ${moneySentNotification.metadata?.loanFunded || false}`);
    } else {
      console.log('❌ Lender did not receive money_sent notification');
    }

    console.log('\n🎉 Loan status update test completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`- Initial Loan Status: ${initialLoanStatus}`);
    console.log(`- After Approval: ${approvedLoanStatus}`);
    console.log(`- After Transfer: ${finalLoanStatus}`);
    console.log(`- Status Changed: ${initialLoanStatus !== finalLoanStatus ? '✅ Yes' : '❌ No'}`);
    console.log(`- Expected Change: ${initialLoanStatus} → funded`);
    console.log(`- Transfer Amount: $${testData.transferAmount}`);
    console.log(`- Funded Amount: $${finalLoanData.fundingProgress?.fundedAmount || 0}`);
    console.log(`- Notifications Sent: ${moneyReceivedNotification && moneySentNotification ? '✅ Yes' : '❌ No'}`);

    // Validation
    if (finalLoanStatus === 'funded') {
      console.log('\n✅ SUCCESS: Loan status correctly updated to "funded"!');
    } else {
      console.log('\n❌ FAILURE: Loan status was not updated to "funded"');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testLoanStatusUpdate();

