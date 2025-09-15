// Script to set up test user data in localStorage
// Run this in the browser console or include it in the app

const setupTestLender = () => {
  const testUser = {
    id: 'test-lender-id-123',
    firstName: 'Test',
    lastName: 'Lender',
    email: 'lender@test.com',
    userType: 'lender',
    kycStatus: 'approved',
    isEmailVerified: true,
    creditScore: 750,
    phone: '+1234567890',
    createdAt: new Date().toISOString()
  };

  const testToken = 'test-access-token-' + Date.now();
  const testRefreshToken = 'test-refresh-token-' + Date.now();

  localStorage.setItem('accessToken', testToken);
  localStorage.setItem('refreshToken', testRefreshToken);
  localStorage.setItem('user', JSON.stringify(testUser));

  console.log('✅ Test lender user created:', testUser);
  console.log('✅ Access token:', testToken);
  console.log('✅ Refresh token:', testRefreshToken);
  
  return testUser;
};

const setupTestBorrower = () => {
  const testUser = {
    id: 'test-borrower-id-123',
    firstName: 'Test',
    lastName: 'Borrower',
    email: 'borrower@test.com',
    userType: 'borrower',
    kycStatus: 'approved',
    isEmailVerified: true,
    creditScore: 600,
    phone: '+1987654321',
    createdAt: new Date().toISOString()
  };

  const testToken = 'test-access-token-borrower-' + Date.now();
  const testRefreshToken = 'test-refresh-token-borrower-' + Date.now();

  localStorage.setItem('accessToken', testToken);
  localStorage.setItem('refreshToken', testRefreshToken);
  localStorage.setItem('user', JSON.stringify(testUser));

  console.log('✅ Test borrower user created:', testUser);
  console.log('✅ Access token:', testToken);
  console.log('✅ Refresh token:', testRefreshToken);
  
  return testUser;
};

const clearTestData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('✅ Test data cleared');
};

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.setupTestLender = setupTestLender;
  window.setupTestBorrower = setupTestBorrower;
  window.clearTestData = clearTestData;
  
  console.log('🔧 Test functions available:');
  console.log('- setupTestLender() - Create test lender user');
  console.log('- setupTestBorrower() - Create test borrower user');
  console.log('- clearTestData() - Clear all test data');
}

module.exports = {
  setupTestLender,
  setupTestBorrower,
  clearTestData
};

