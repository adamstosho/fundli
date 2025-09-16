const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function createTestDataViaAPI() {
  try {
    console.log('🔍 Creating test data via API...');
    
    // Step 1: Create test borrower
    console.log('👤 Creating test borrower...');
    let borrowerToken = null;
    try {
      const borrowerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Borrower',
        email: 'borrower@test.com',
        phone: '+1234567890',
        password: 'TestPassword123!',
        userType: 'borrower'
      });
      borrowerToken = borrowerResponse.data.accessToken;
      console.log('✅ Test borrower created and logged in');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        // Try to login instead
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'borrower@test.com',
          password: 'TestPassword123!'
        });
        borrowerToken = loginResponse.data.accessToken;
        console.log('✅ Test borrower logged in (already exists)');
      } else {
        throw error;
      }
    }

    // Step 2: Create test lender
    console.log('👤 Creating test lender...');
    let lenderToken = null;
    try {
      const lenderResponse = await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Lender',
        email: 'lender@test.com',
        phone: '+1234567890',
        password: 'TestPassword123!',
        userType: 'lender'
      });
      lenderToken = lenderResponse.data.accessToken;
      console.log('✅ Test lender created and logged in');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        // Try to login instead
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'lender@test.com',
          password: 'TestPassword123!'
        });
        lenderToken = loginResponse.data.accessToken;
        console.log('✅ Test lender logged in (already exists)');
      } else {
        throw error;
      }
    }

    // Step 3: Create test admin
    console.log('👤 Creating test admin...');
    let adminToken = null;
    try {
      const adminResponse = await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        phone: '+1234567890',
        password: 'TestPassword123!',
        userType: 'admin'
      });
      adminToken = adminResponse.data.accessToken;
      console.log('✅ Test admin created and logged in');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        // Try to login instead
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'admin@test.com',
          password: 'TestPassword123!'
        });
        adminToken = loginResponse.data.accessToken;
        console.log('✅ Test admin logged in (already exists)');
      } else {
        throw error;
      }
    }

    // Step 4: Create test loan application
    console.log('📝 Creating test loan application...');
    let loanId = null;
    try {
      const loanResponse = await axios.post(`${BASE_URL}/borrower/loan/apply`, {
        requestedAmount: 50000,
        purpose: 'Business Expansion',
        duration: 12,
        collateral: {
          type: 'property',
          description: 'Commercial property in downtown area',
          estimatedValue: 100000
        }
      }, {
        headers: { 'Authorization': `Bearer ${borrowerToken}` }
      });
      
      loanId = loanResponse.data.data.loan.id;
      console.log('✅ Test loan application created:', loanId);
    } catch (error) {
      console.log('❌ Loan creation failed:', error.response?.data || error.message);
    }

    // Step 5: Approve the loan as admin
    if (loanId) {
      console.log('✅ Approving loan as admin...');
      try {
        await axios.post(`${BASE_URL}/admin/loan/${loanId}/approve`, {
          action: 'approve',
          adminNotes: 'Test approval for demo purposes'
        }, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('✅ Loan approved by admin');
      } catch (error) {
        console.log('❌ Loan approval failed:', error.response?.data || error.message);
      }
    }

    // Step 6: Check lender dashboard data
    console.log('🔍 Checking lender dashboard data...');
    try {
      const loanAppsResponse = await axios.get(`${BASE_URL}/lender/loan-applications`, {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });
      console.log('📊 Loan applications for lender:', loanAppsResponse.data.data.loanApplications.length);
    } catch (error) {
      console.log('❌ Failed to fetch loan applications:', error.response?.data || error.message);
    }

    // Step 7: Check lender notifications
    console.log('🔍 Checking lender notifications...');
    try {
      const notificationsResponse = await axios.get(`${BASE_URL}/lender/notifications`, {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });
      console.log('🔔 Notifications for lender:', notificationsResponse.data.data.notifications.length);
    } catch (error) {
      console.log('❌ Failed to fetch notifications:', error.response?.data || error.message);
    }

    console.log('🎉 Test data creation complete!');
    console.log('📊 Test Users Created:');
    console.log('  - Borrower: borrower@test.com / TestPassword123!');
    console.log('  - Lender: lender@test.com / TestPassword123!');
    console.log('  - Admin: admin@test.com / TestPassword123!');
    console.log('📝 Test Loan: $50,000 Business Expansion');
    console.log('✅ Loan Status: Approved (should trigger notifications)');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.response?.data || error.message);
  }
}

createTestDataViaAPI();




