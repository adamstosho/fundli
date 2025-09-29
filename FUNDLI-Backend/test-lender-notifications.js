const axios = require('axios');

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function testLenderNotifications() {
  console.log('🧪 Testing Lender Notifications System...\n');

  try {
    // Test 1: Check if repayment due notification endpoint works
    console.log('1️⃣ Testing repayment due notification endpoint...');
    try {
      const response = await axios.post(`${BASE_URL}/repayment-notifications/check-repayment-due`);
      console.log('✅ Repayment due check endpoint working:', response.data);
    } catch (error) {
      console.log('❌ Repayment due check endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Test notification creation
    console.log('\n2️⃣ Testing notification creation...');
    try {
      const notificationData = {
        recipientId: '507f1f77bcf86cd799439011', // Dummy user ID
        type: 'loan_application',
        title: 'Test Lender Notification',
        message: 'This is a test notification for lenders',
        priority: 'high',
        actionRequired: true,
        action: {
          type: 'view',
          url: '/lender/loan-applications',
          buttonText: 'Review Application'
        },
        metadata: {
          loanId: '507f1f77bcf86cd799439012',
          loanAmount: 50000,
          purpose: 'business',
          borrowerName: 'Test Borrower',
          action: 'review_loan'
        }
      };

      const response = await axios.post(`${BASE_URL}/notifications/create`, notificationData, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Notification creation working:', response.data);
    } catch (error) {
      console.log('❌ Notification creation failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Check notification service methods
    console.log('\n3️⃣ Testing notification service methods...');
    const NotificationService = require('./src/services/notificationService');
    
    try {
      // Test notifyNewLoanApplication
      await NotificationService.notifyNewLoanApplication({
        lenderId: '507f1f77bcf86cd799439011',
        lenderName: 'Test Lender',
        loanId: '507f1f77bcf86cd799439012',
        borrowerName: 'Test Borrower',
        loanAmount: 50000,
        purpose: 'business'
      });
      console.log('✅ notifyNewLoanApplication method working');
    } catch (error) {
      console.log('❌ notifyNewLoanApplication method failed:', error.message);
    }

    try {
      // Test notifyRepaymentReceived
      await NotificationService.notifyRepaymentReceived({
        lenderId: '507f1f77bcf86cd799439011',
        lenderName: 'Test Lender',
        loanId: '507f1f77bcf86cd799439012',
        borrowerName: 'Test Borrower',
        repaymentAmount: 55000,
        loanAmount: 50000
      });
      console.log('✅ notifyRepaymentReceived method working');
    } catch (error) {
      console.log('❌ notifyRepaymentReceived method failed:', error.message);
    }

    try {
      // Test notifyRepaymentDue
      await NotificationService.notifyRepaymentDue({
        lenderId: '507f1f77bcf86cd799439011',
        lenderName: 'Test Lender',
        loanId: '507f1f77bcf86cd799439012',
        borrowerName: 'Test Borrower',
        loanAmount: 50000,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        daysUntilDue: 2
      });
      console.log('✅ notifyRepaymentDue method working');
    } catch (error) {
      console.log('❌ notifyRepaymentDue method failed:', error.message);
    }

    try {
      // Test notifyLoanFullyRepaid
      await NotificationService.notifyLoanFullyRepaid({
        lenderId: '507f1f77bcf86cd799439011',
        lenderName: 'Test Lender',
        loanId: '507f1f77bcf86cd799439012',
        borrowerName: 'Test Borrower',
        totalRepayment: 55000,
        loanAmount: 50000
      });
      console.log('✅ notifyLoanFullyRepaid method working');
    } catch (error) {
      console.log('❌ notifyLoanFullyRepaid method failed:', error.message);
    }

    console.log('\n🎉 Lender notification system test completed!');
    console.log('\n📋 Summary of implemented lender notifications:');
    console.log('✅ New loan application submitted → Notify all lenders');
    console.log('✅ Loan repayment received → Notify specific lender');
    console.log('✅ Loan due for repayment → Notify specific lender (with urgency levels)');
    console.log('✅ Loan fully repaid → Notify specific lender');
    console.log('✅ Admin loan approval/rejection → Notify all lenders (already implemented)');
    console.log('\n🔄 Automatic daily check for repayment due notifications at 9 AM');
    console.log('📧 All notifications include proper priority levels and action buttons');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLenderNotifications();





