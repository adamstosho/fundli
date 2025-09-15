console.log('🔍 Testing admin-to-lender flow...');

// Test 1: Check if we can make API calls
fetch('http://localhost:5000/api/health')
  .then(response => {
    console.log('✅ Backend is running:', response.status);
    return testFlow();
  })
  .catch(error => {
    console.log('❌ Backend not responding:', error.message);
  });

async function testFlow() {
  try {
    console.log('\n👤 Step 1: Testing user creation...');
    
    // Create or login borrower
    let borrowerToken = null;
    try {
      const borrowerResponse = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Borrower',
          email: 'borrower2@test.com',
          phone: '+1234567890',
          password: 'TestPassword123!',
          userType: 'borrower'
        })
      });
      
      if (borrowerResponse.ok) {
        const data = await borrowerResponse.json();
        borrowerToken = data.accessToken || data.data?.accessToken;
        console.log('✅ Borrower created, token:', borrowerToken ? 'Yes' : 'No');
      } else {
        // Try login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'borrower2@test.com',
            password: 'TestPassword123!'
          })
        });
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('🔍 Login response data:', loginData);
          borrowerToken = loginData.accessToken || loginData.data?.accessToken;
          console.log('✅ Borrower logged in, token:', borrowerToken ? 'Yes' : 'No');
        } else {
          const errorText = await loginResponse.text();
          console.log('❌ Borrower login failed:', errorText);
        }
      }
    } catch (error) {
      console.log('❌ Borrower error:', error.message);
    }

    // Create or login lender
    let lenderToken = null;
    try {
      const lenderResponse = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Lender',
          email: 'lender2@test.com',
          phone: '+1234567890',
          password: 'TestPassword123!',
          userType: 'lender'
        })
      });
      
      if (lenderResponse.ok) {
        const data = await lenderResponse.json();
        lenderToken = data.accessToken || data.data?.accessToken;
        console.log('✅ Lender created, token:', lenderToken ? 'Yes' : 'No');
      } else {
        // Try login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'lender2@test.com',
            password: 'TestPassword123!'
          })
        });
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          lenderToken = loginData.accessToken || loginData.data?.accessToken;
          console.log('✅ Lender logged in, token:', lenderToken ? 'Yes' : 'No');
        } else {
          console.log('❌ Lender login failed:', await loginResponse.text());
        }
      }
    } catch (error) {
      console.log('❌ Lender error:', error.message);
    }

    // Create or login admin
    let adminToken = null;
    try {
      const adminResponse = await fetch('http://localhost:5000/api/auth/register', {
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
      
      if (adminResponse.ok) {
        const data = await adminResponse.json();
        adminToken = data.accessToken || data.data?.accessToken;
        console.log('✅ Admin created, token:', adminToken ? 'Yes' : 'No');
      } else {
        // Try login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'TestPassword123!'
          })
        });
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          adminToken = loginData.accessToken || loginData.data?.accessToken;
          console.log('✅ Admin logged in, token:', adminToken ? 'Yes' : 'No');
        } else {
          console.log('❌ Admin login failed:', await loginResponse.text());
        }
      }
    } catch (error) {
      console.log('❌ Admin error:', error.message);
    }

    console.log('\n📝 Step 2: Testing loan creation...');
    let loanId = null;
    if (borrowerToken) {
      const loanResponse = await fetch('http://localhost:5000/api/borrower/loan/apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${borrowerToken}`
        },
        body: JSON.stringify({
          loanAmount: 50000,
          purpose: 'business',
          duration: 12,
          collateral: {
            type: 'real_estate',
            description: 'Commercial property in downtown area',
            estimatedValue: 100000
          }
        })
      });
      
      if (loanResponse.ok) {
        const data = await loanResponse.json();
        loanId = data.data.loan.id;
        console.log('✅ Loan created:', loanId);
        console.log('📊 Loan status:', data.data.loan.status);
      } else {
        const errorText = await loanResponse.text();
        console.log('❌ Loan creation failed:', errorText);
      }
    } else {
      console.log('❌ No borrower token available');
    }

    console.log('\n🔍 Step 3: Testing lender dashboard before approval...');
    if (lenderToken) {
      const lenderDashboardResponse = await fetch('http://localhost:5000/api/lender/loan-applications', {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });
      
      if (lenderDashboardResponse.ok) {
        const data = await lenderDashboardResponse.json();
        console.log('📊 Loan applications before approval:', data.data.loanApplications.length);
        data.data.loanApplications.forEach(loan => {
          console.log(`  - ${loan.id}: ${loan.status} | $${loan.loanAmount} | ${loan.purpose}`);
        });
      } else {
        const errorText = await lenderDashboardResponse.text();
        console.log('❌ Failed to fetch loan applications:', errorText);
      }
    } else {
      console.log('❌ No lender token available');
    }

    console.log('\n✅ Step 4: Testing loan approval...');
    if (loanId && adminToken) {
      const approvalResponse = await fetch(`http://localhost:5000/api/admin/loan/${loanId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          action: 'approve',
          adminNotes: 'Test approval'
        })
      });
      
      if (approvalResponse.ok) {
        const data = await approvalResponse.json();
        console.log('✅ Loan approved');
        console.log('📊 Approval response:', data.message);
      } else {
        const errorText = await approvalResponse.text();
        console.log('❌ Loan approval failed:', errorText);
      }
    } else {
      console.log('❌ No loan ID or admin token available');
    }

    console.log('\n🔍 Step 5: Testing lender dashboard after approval...');
    if (lenderToken) {
      const lenderDashboardResponse = await fetch('http://localhost:5000/api/lender/loan-applications', {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });
      
      if (lenderDashboardResponse.ok) {
        const data = await lenderDashboardResponse.json();
        console.log('📊 Loan applications after approval:', data.data.loanApplications.length);
        data.data.loanApplications.forEach(loan => {
          console.log(`  - ${loan.id}: ${loan.status} | $${loan.loanAmount} | ${loan.purpose}`);
        });
      } else {
        const errorText = await lenderDashboardResponse.text();
        console.log('❌ Failed to fetch loan applications:', errorText);
      }
    } else {
      console.log('❌ No lender token available');
    }

    console.log('\n🔔 Step 6: Testing lender notifications after approval...');
    if (lenderToken) {
      const notificationsResponse = await fetch('http://localhost:5000/api/lender/notifications', {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });
      
      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        console.log('🔔 Notifications after approval:', data.data.notifications.length);
        data.data.notifications.forEach(notif => {
          console.log(`  - ${notif._id}: ${notif.title} | ${notif.status}`);
        });
      } else {
        const errorText = await notificationsResponse.text();
        console.log('❌ Failed to fetch notifications:', errorText);
      }
    } else {
      console.log('❌ No lender token available');
    }

    console.log('\n🎉 Flow test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}
