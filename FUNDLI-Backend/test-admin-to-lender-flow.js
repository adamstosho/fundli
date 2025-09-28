const fetch = require('node-fetch');

const BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function testAdminToLenderFlow() {
  try {
    console.log('🔍 Testing complete admin-to-lender flow...');
    
    // Step 1: Create test users
    console.log('\n👤 Step 1: Creating test users...');
    let borrowerToken, lenderToken, adminToken;
    
    // Create borrower
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
        console.log('✅ Borrower created');
      } else {
        // Try login
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
        console.log('✅ Borrower logged in');
      }
    } catch (error) {
      console.log('❌ Borrower creation failed:', error.message);
    }

    // Create lender
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
        console.log('✅ Lender created');
      } else {
        // Try login
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
        console.log('✅ Lender logged in');
      }
    } catch (error) {
      console.log('❌ Lender creation failed:', error.message);
    }

    // Create admin
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
        console.log('✅ Admin created');
      } else {
        // Try login
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
        console.log('✅ Admin logged in');
      }
    } catch (error) {
      console.log('❌ Admin creation failed:', error.message);
    }

    // Step 2: Create loan application
    console.log('\n📝 Step 2: Creating loan application...');
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
          console.log('✅ Loan application created:', loanId);
        } else {
          const errorData = await response.json();
          console.log('❌ Loan creation failed:', errorData.message);
        }
      } catch (error) {
        console.log('❌ Loan creation error:', error.message);
      }
    }

    // Step 3: Check lender dashboard before approval
    console.log('\n🔍 Step 3: Checking lender dashboard before approval...');
    if (lenderToken) {
      try {
        const response = await fetch(`${BASE_URL}/lender/loan-applications`, {
          headers: { 'Authorization': `Bearer ${lenderToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Loan applications before approval:', data.data.loanApplications.length);
          data.data.loanApplications.forEach(loan => {
            console.log(`  - ${loan.id}: ${loan.status} | $${loan.loanAmount} | ${loan.purpose}`);
          });
        } else {
          console.log('❌ Failed to fetch loan applications');
        }
      } catch (error) {
        console.log('❌ Error fetching loan applications:', error.message);
      }
    }

    // Step 4: Check lender notifications before approval
    console.log('\n🔔 Step 4: Checking lender notifications before approval...');
    if (lenderToken) {
      try {
        const response = await fetch(`${BASE_URL}/lender/notifications`, {
          headers: { 'Authorization': `Bearer ${lenderToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔔 Notifications before approval:', data.data.notifications.length);
        } else {
          console.log('❌ Failed to fetch notifications');
        }
      } catch (error) {
        console.log('❌ Error fetching notifications:', error.message);
      }
    }

    // Step 5: Approve loan as admin
    console.log('\n✅ Step 5: Approving loan as admin...');
    if (loanId && adminToken) {
      try {
        const response = await fetch(`${BASE_URL}/admin/loan/${loanId}/approve`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            action: 'approve',
            adminNotes: 'Test approval for flow verification'
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

    // Step 6: Check lender dashboard after approval
    console.log('\n🔍 Step 6: Checking lender dashboard after approval...');
    if (lenderToken) {
      try {
        const response = await fetch(`${BASE_URL}/lender/loan-applications`, {
          headers: { 'Authorization': `Bearer ${lenderToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Loan applications after approval:', data.data.loanApplications.length);
          data.data.loanApplications.forEach(loan => {
            console.log(`  - ${loan.id}: ${loan.status} | $${loan.loanAmount} | ${loan.purpose}`);
          });
        } else {
          console.log('❌ Failed to fetch loan applications');
        }
      } catch (error) {
        console.log('❌ Error fetching loan applications:', error.message);
      }
    }

    // Step 7: Check lender notifications after approval
    console.log('\n🔔 Step 7: Checking lender notifications after approval...');
    if (lenderToken) {
      try {
        const response = await fetch(`${BASE_URL}/lender/notifications`, {
          headers: { 'Authorization': `Bearer ${lenderToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔔 Notifications after approval:', data.data.notifications.length);
          data.data.notifications.forEach(notif => {
            console.log(`  - ${notif._id}: ${notif.title} | ${notif.status}`);
          });
        } else {
          console.log('❌ Failed to fetch notifications');
        }
      } catch (error) {
        console.log('❌ Error fetching notifications:', error.message);
      }
    }

    console.log('\n🎉 Flow test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminToLenderFlow();












