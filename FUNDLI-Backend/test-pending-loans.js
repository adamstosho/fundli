// Test script to verify pending loans functionality for all user types
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testPendingLoansFlow() {
  try {
    console.log('🧪 Testing pending loans functionality for all user types...\n');

    // Step 1: Register a borrower
    console.log('1️⃣ Registering a test borrower...');
    const borrowerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      password: 'Password123',
      userType: 'borrower',
      phoneNumber: '1234567890'
    };

    let borrowerResponse;
    try {
      borrowerResponse = await axios.post(`${API_BASE}/auth/register`, borrowerData);
      console.log('✅ Borrower registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Borrower already exists, proceeding with login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: borrowerData.email,
          password: borrowerData.password
        });
        borrowerResponse = { data: loginResponse.data };
      } else {
        throw error;
      }
    }

    const borrowerToken = borrowerResponse.data.data.token;
    console.log('🔑 Borrower token obtained\n');

    // Step 2: Apply for a loan
    console.log('2️⃣ Applying for a loan...');
    const loanData = {
      amount: 5000,
      purpose: 'business',
      duration: 12,
      repaymentSchedule: 'monthly',
      description: 'Test loan for business expansion',
      collateral: []
    };

    const loanResponse = await axios.post(`${API_BASE}/loans/apply`, loanData, {
      headers: {
        'Authorization': `Bearer ${borrowerToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Loan application submitted successfully');
    console.log(`📋 Loan ID: ${loanResponse.data.data.loanId}`);
    console.log(`📊 Status: ${loanResponse.data.data.status}\n`);

    // Step 3: Test borrower viewing their pending loans
    console.log('3️⃣ Testing borrower viewing their pending loans...');
    const borrowerPendingResponse = await axios.get(`${API_BASE}/loans/pending/borrower`, {
      headers: {
        'Authorization': `Bearer ${borrowerToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Borrower pending loans retrieved successfully');
    console.log(`📊 Borrower pending loans: ${borrowerPendingResponse.data.data.total}`);
    console.log(`📋 Loans:`, borrowerPendingResponse.data.data.loans.map(loan => ({
      id: loan._id,
      amount: loan.loanAmount,
      purpose: loan.purpose,
      status: loan.status
    })));

    // Step 4: Register a lender
    console.log('\n4️⃣ Registering a test lender...');
    const lenderData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      password: 'Password123',
      userType: 'lender',
      phoneNumber: '1234567891'
    };

    let lenderResponse;
    try {
      lenderResponse = await axios.post(`${API_BASE}/auth/register`, lenderData);
      console.log('✅ Lender registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Lender already exists, proceeding with login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: lenderData.email,
          password: lenderData.password
        });
        lenderResponse = { data: loginResponse.data };
      } else {
        throw error;
      }
    }

    const lenderToken = lenderResponse.data.data.token;
    console.log('🔑 Lender token obtained\n');

    // Step 5: Test lender viewing all pending loans
    console.log('5️⃣ Testing lender viewing all pending loans...');
    const lenderPendingResponse = await axios.get(`${API_BASE}/loans/pending/all`, {
      headers: {
        'Authorization': `Bearer ${lenderToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Lender pending loans retrieved successfully');
    console.log(`📊 Total pending loans: ${lenderPendingResponse.data.data.total}`);
    console.log(`📋 Loans:`, lenderPendingResponse.data.data.loans.map(loan => ({
      id: loan.id,
      amount: loan.loanAmount,
      purpose: loan.purpose,
      borrower: loan.borrower.name,
      status: loan.status
    })));

    // Step 6: Register an admin
    console.log('\n6️⃣ Registering a test admin...');
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'Password123',
      userType: 'admin',
      phoneNumber: '1234567892'
    };

    let adminResponse;
    try {
      adminResponse = await axios.post(`${API_BASE}/auth/register`, adminData);
      console.log('✅ Admin registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Admin already exists, proceeding with login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: adminData.email,
          password: adminData.password
        });
        adminResponse = { data: loginResponse.data };
      } else {
        throw error;
      }
    }

    const adminToken = adminResponse.data.data.token;
    console.log('🔑 Admin token obtained\n');

    // Step 7: Test admin viewing all pending loans
    console.log('7️⃣ Testing admin viewing all pending loans...');
    const adminPendingResponse = await axios.get(`${API_BASE}/loans/pending/all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Admin pending loans retrieved successfully');
    console.log(`📊 Total pending loans: ${adminPendingResponse.data.data.total}`);
    console.log(`📋 Loans:`, adminPendingResponse.data.data.loans.map(loan => ({
      id: loan.id,
      amount: loan.loanAmount,
      purpose: loan.purpose,
      borrower: loan.borrower.name,
      status: loan.status
    })));

    console.log('\n🎉 SUCCESS: All user types can now view pending loans!');
    console.log('📝 Summary:');
    console.log(`  - Borrowers can view their own pending loans: ${borrowerPendingResponse.data.data.total} loans`);
    console.log(`  - Lenders can view all pending loans for investment: ${lenderPendingResponse.data.data.total} loans`);
    console.log(`  - Admins can view all pending loans for management: ${adminPendingResponse.data.data.total} loans`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testPendingLoansFlow();
