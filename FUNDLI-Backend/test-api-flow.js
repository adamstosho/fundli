// Test script to create a loan and check if it appears in lender dashboard
const axios = require('axios');

const API_BASE = 'https://fundli-hjqn.vercel.app/api';

async function testLoanFlow() {
  try {
    console.log('🧪 Testing loan application flow...\n');

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

    // Step 3: Register a lender
    console.log('3️⃣ Registering a test lender...');
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

    // Step 4: Check loan applications from lender perspective
    console.log('4️⃣ Checking loan applications from lender dashboard...');
    const applicationsResponse = await axios.get(`${API_BASE}/lender/loan-applications`, {
      headers: {
        'Authorization': `Bearer ${lenderToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Loan applications retrieved successfully');
    console.log(`📊 Total applications: ${applicationsResponse.data.data.total}`);
    console.log(`📋 Applications:`, applicationsResponse.data.data.loanApplications);

    if (applicationsResponse.data.data.loanApplications.length > 0) {
      console.log('\n🎉 SUCCESS: Lender can see pending loan applications!');
      console.log('📝 Application details:');
      applicationsResponse.data.data.loanApplications.forEach((app, index) => {
        console.log(`  ${index + 1}. Amount: $${app.loanAmount}, Purpose: ${app.purpose}, Status: ${app.status}`);
      });
    } else {
      console.log('\n❌ ISSUE: No loan applications found in lender dashboard');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testLoanFlow();
