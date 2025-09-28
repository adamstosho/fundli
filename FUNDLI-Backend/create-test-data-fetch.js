const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function createTestDataViaAPI() {
  try {
    console.log('🔍 Creating test data via API...');
    
    // Step 1: Create test borrower
    console.log('👤 Creating test borrower...');
    let borrowerToken = null;
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Borrower',
          email: 'borrower@test.com',
          phone: '+1234567890',
          password: 'TestPassword123!',
          userType: 'borrower'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        borrowerToken = data.accessToken;
        console.log('✅ Test borrower created and logged in');
      } else {
        const errorData = await response.json();
        if (errorData.message?.includes('already exists')) {
          // Try to login instead
          const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'borrower@test.com',
              password: 'TestPassword123!'
            })
          });
          const loginData = await loginResponse.json();
          borrowerToken = loginData.accessToken;
          console.log('✅ Test borrower logged in (already exists)');
        } else {
          throw new Error(errorData.message);
        }
      }
    } catch (error) {
      console.log('❌ Borrower creation failed:', error.message);
    }

    // Step 2: Create test lender
    console.log('👤 Creating test lender...');
    let lenderToken = null;
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Lender',
          email: 'lender@test.com',
          phone: '+1234567890',
          password: 'TestPassword123!',
          userType: 'lender'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        lenderToken = data.accessToken;
        console.log('✅ Test lender created and logged in');
      } else {
        const errorData = await response.json();
        if (errorData.message?.includes('already exists')) {
          // Try to login instead
          const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'lender@test.com',
              password: 'TestPassword123!'
            })
          });
          const loginData = await loginResponse.json();
          lenderToken = loginData.accessToken;
          console.log('✅ Test lender logged in (already exists)');
        } else {
          throw new Error(errorData.message);
        }
      }
    } catch (error) {
      console.log('❌ Lender creation failed:', error.message);
    }

    // Step 3: Create test admin
    console.log('👤 Creating test admin...');
    let adminToken = null;
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Admin',
          email: 'admin@test.com',
          phone: '+1234567890',
          password: 'TestPassword123!',
          userType: 'admin'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        adminToken = data.accessToken;
        console.log('✅ Test admin created and logged in');
      } else {
        const errorData = await response.json();
        if (errorData.message?.includes('already exists')) {
          // Try to login instead
          const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'admin@test.com',
              password: 'TestPassword123!'
            })
          });
          const loginData = await loginResponse.json();
          adminToken = loginData.accessToken;
          console.log('✅ Test admin logged in (already exists)');
        } else {
          throw new Error(errorData.message);
        }
      }
    } catch (error) {
      console.log('❌ Admin creation failed:', error.message);
    }

    // Step 4: Create test loan application
    console.log('📝 Creating test loan application...');
    let loanId = null;
    if (borrowerToken) {
      try {
        const response = await fetch(`${BASE_URL}/borrower/loan/apply`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${borrowerToken}`
          },
          body: JSON.stringify({
            requestedAmount: 50000,
            purpose: 'Business Expansion',
            duration: 12,
            collateral: {
              type: 'property',
              description: 'Commercial property in downtown area',
              estimatedValue: 100000
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          loanId = data.data.loan.id;
          console.log('✅ Test loan application created:', loanId);
        } else {
          const errorData = await response.json();
          console.log('❌ Loan creation failed:', errorData.message);
        }
      } catch (error) {
        console.log('❌ Loan creation error:', error.message);
      }
    }

    // Step 5: Approve the loan as admin
    if (loanId && adminToken) {
      console.log('✅ Approving loan as admin...');
      try {
        const response = await fetch(`${BASE_URL}/admin/loan/${loanId}/approve`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            action: 'approve',
            adminNotes: 'Test approval for demo purposes'
          })
        });
        
        if (response.ok) {
          console.log('✅ Loan approved by admin');
        } else {
          const errorData = await response.json();
          console.log('❌ Loan approval failed:', errorData.message);
        }
      } catch (error) {
        console.log('❌ Loan approval error:', error.message);
      }
    }

    // Step 6: Check lender dashboard data
    console.log('🔍 Checking lender dashboard data...');
    if (lenderToken) {
      try {
        const response = await fetch(`${BASE_URL}/lender/loan-applications`, {
          headers: { 'Authorization': `Bearer ${lenderToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Loan applications for lender:', data.data.loanApplications.length);
        } else {
          const errorData = await response.json();
          console.log('❌ Failed to fetch loan applications:', errorData.message);
        }
      } catch (error) {
        console.log('❌ Loan applications error:', error.message);
      }
    }

    // Step 7: Check lender notifications
    console.log('🔍 Checking lender notifications...');
    if (lenderToken) {
      try {
        const response = await fetch(`${BASE_URL}/lender/notifications`, {
          headers: { 'Authorization': `Bearer ${lenderToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔔 Notifications for lender:', data.data.notifications.length);
        } else {
          const errorData = await response.json();
          console.log('❌ Failed to fetch notifications:', errorData.message);
        }
      } catch (error) {
        console.log('❌ Notifications error:', error.message);
      }
    }

    console.log('🎉 Test data creation complete!');
    console.log('📊 Test Users Created:');
    console.log('  - Borrower: borrower@test.com / TestPassword123!');
    console.log('  - Lender: lender@test.com / TestPassword123!');
    console.log('  - Admin: admin@test.com / TestPassword123!');
    console.log('📝 Test Loan: $50,000 Business Expansion');
    console.log('✅ Loan Status: Approved (should trigger notifications)');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createTestDataViaAPI();












