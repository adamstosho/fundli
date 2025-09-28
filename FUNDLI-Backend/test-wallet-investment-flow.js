const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test wallet balance updates during investment
async function testWalletInvestmentFlow() {
  console.log('🚀 Testing Wallet Investment Flow');
  console.log('=====================================');

  try {
    // Step 1: Login as lender
    console.log('\n📝 Step 1: Login as lender...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ua67527056@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    const lenderId = loginResponse.data.data.user.id;
    console.log('✅ Lender logged in:', lenderId);

    // Step 2: Get initial wallet balance
    console.log('\n💰 Step 2: Get initial wallet balance...');
    const initialWalletResponse = await axios.get(`${BASE_URL}/lender/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const initialBalance = initialWalletResponse.data.data.balance;
    console.log('📊 Initial wallet balance:', initialBalance);

    // Step 3: Get available loan applications
    console.log('\n📋 Step 3: Get available loan applications...');
    const loansResponse = await axios.get(`${BASE_URL}/lender/loan-applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const availableLoans = loansResponse.data.data.loanApplications;
    console.log('📋 Available loans:', availableLoans.length);

    if (availableLoans.length === 0) {
      console.log('⚠️  No available loans to test with');
      return;
    }

    const testLoan = availableLoans[0];
    console.log('🎯 Testing with loan:', testLoan.id, 'Amount:', testLoan.loanAmount);

    // Step 4: Fund the loan
    console.log('\n💸 Step 4: Fund the loan...');
    const investmentAmount = Math.min(1000, testLoan.loanAmount); // Test with 1000 or loan amount
    console.log('💵 Investment amount:', investmentAmount);

    const fundingResponse = await axios.post(`${BASE_URL}/lender/loan/${testLoan.id}/accept`, {
      investmentAmount: investmentAmount,
      notes: 'Test investment'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Funding response status:', fundingResponse.status);
    console.log('📊 Funding response data:', JSON.stringify(fundingResponse.data, null, 2));

    // Step 5: Check updated wallet balance
    console.log('\n💰 Step 5: Check updated wallet balance...');
    const updatedWalletResponse = await axios.get(`${BASE_URL}/lender/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const updatedBalance = updatedWalletResponse.data.data.balance;
    console.log('📊 Updated wallet balance:', updatedBalance);
    console.log('📊 Expected balance:', initialBalance - investmentAmount);
    console.log('📊 Balance difference:', initialBalance - updatedBalance);

    // Step 6: Check investment stats
    console.log('\n📈 Step 6: Check investment stats...');
    const statsResponse = await axios.get(`${BASE_URL}/lender/investment-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const investmentStats = statsResponse.data.data.investmentStats;
    console.log('📈 Investment stats:', JSON.stringify(investmentStats, null, 2));

    // Verification
    console.log('\n✅ VERIFICATION:');
    console.log('================');
    
    const balanceCorrect = Math.abs((initialBalance - investmentAmount) - updatedBalance) < 0.01;
    console.log('💰 Wallet balance updated correctly:', balanceCorrect ? '✅ YES' : '❌ NO');
    
    const statsUpdated = investmentStats.totalInvested >= investmentAmount;
    console.log('📈 Investment stats updated:', statsUpdated ? '✅ YES' : '❌ NO');
    
    const loanFunded = fundingResponse.data.status === 'success';
    console.log('🎯 Loan funded successfully:', loanFunded ? '✅ YES' : '❌ NO');

    if (balanceCorrect && statsUpdated && loanFunded) {
      console.log('\n🎉 ALL TESTS PASSED! Wallet investment flow is working correctly.');
    } else {
      console.log('\n❌ SOME TESTS FAILED! Check the issues above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testWalletInvestmentFlow();







