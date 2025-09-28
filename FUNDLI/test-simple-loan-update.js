// Simple test to verify loan status update
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testSimpleLoanUpdate() {
  try {
    console.log('🧪 Simple Loan Status Update Test...\n');

    // Step 1: Login as lender
    const lenderResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'lender@test.com',
      password: 'password123'
    });
    const lenderToken = lenderResponse.data.data.accessToken;
    console.log('✅ Lender logged in');

    // Step 2: Login as borrower
    const borrowerResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'borrower@test.com',
      password: 'password123'
    });
    const borrowerToken = borrowerResponse.data.data.accessToken;
    const borrowerId = borrowerResponse.data.data.user.id;
    console.log('✅ Borrower logged in');

    // Step 3: Get borrower's loans
    const loansResponse = await axios.get(`${API_BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const loans = loansResponse.data.data.loans || [];
    console.log(`📋 Borrower has ${loans.length} loans:`);
    loans.forEach(loan => {
      console.log(`   - Loan ${loan.id}: Status=${loan.status}, Amount=$${loan.loanAmount}`);
    });

    // Find approved/pending loans
    const approvedLoans = loans.filter(loan => 
      loan.status === 'approved' || loan.status === 'pending'
    );
    
    if (approvedLoans.length === 0) {
      console.log('❌ No approved/pending loans found');
      console.log('💡 The borrower needs to have an approved loan for the status to update');
      return;
    }

    console.log(`✅ Found ${approvedLoans.length} approved/pending loans`);

    // Step 4: Transfer money
    console.log('\n💰 Transferring $100 to borrower...');
    const transferResponse = await axios.post(`${API_BASE_URL}/wallet/transfer`, {
      toUserId: borrowerId,
      amount: 100,
      description: 'Test loan funding'
    }, {
      headers: { Authorization: `Bearer ${lenderToken}` }
    });

    console.log('✅ Transfer completed');
    console.log(`Transfer reference: ${transferResponse.data.data.transfer.reference}`);
    console.log(`Loan updated: ${transferResponse.data.data.loanUpdated}`);

    if (transferResponse.data.data.loanUpdated) {
      const loanInfo = transferResponse.data.data.loan;
      console.log(`✅ Loan ${loanInfo.id} status updated to: ${loanInfo.status}`);
    } else {
      console.log('❌ No loan was updated');
    }

    // Step 5: Check loan status after transfer
    console.log('\n🔍 Checking loan status after transfer...');
    const updatedLoansResponse = await axios.get(`${API_BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    
    const updatedLoans = updatedLoansResponse.data.data.loans || [];
    console.log(`📋 Updated loans:`);
    updatedLoans.forEach(loan => {
      console.log(`   - Loan ${loan.id}: Status=${loan.status}, Amount=$${loan.loanAmount}`);
      if (loan.fundingProgress) {
        console.log(`     Funded: $${loan.fundingProgress.fundedAmount || 0}`);
        console.log(`     Investors: ${loan.fundingProgress.investors?.length || 0}`);
      }
    });

    // Check if any loan changed status
    const statusChanged = loans.some(originalLoan => {
      const updatedLoan = updatedLoans.find(l => l.id === originalLoan.id);
      return updatedLoan && originalLoan.status !== updatedLoan.status;
    });

    if (statusChanged) {
      console.log('\n🎉 SUCCESS: Loan status was updated!');
    } else {
      console.log('\n❌ ISSUE: No loan status changes detected');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSimpleLoanUpdate();
