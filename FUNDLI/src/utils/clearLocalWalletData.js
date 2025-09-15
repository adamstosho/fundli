// Utility to clear incorrect local wallet data
// This should be called when the app starts to reset any existing incorrect data

export const clearIncorrectWalletData = () => {
  try {
    const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
    
    // Check if borrower has incorrect balance (1000 instead of 0)
    if (localWallets.borrower && localWallets.borrower.balance === 1000) {
      console.log('🔄 Clearing incorrect borrower wallet data...');
      localWallets.borrower.balance = 0;
      localWallets.borrower.updatedAt = new Date().toISOString();
      localStorage.setItem('localWallets', JSON.stringify(localWallets));
      console.log('✅ Borrower wallet balance reset to 0');
    }
    
    // Check if any user types have incorrect data (should all be 0)
    Object.keys(localWallets).forEach(userType => {
      if (localWallets[userType].balance !== 0) {
        localWallets[userType].balance = 0;
        localWallets[userType].updatedAt = new Date().toISOString();
        console.log(`✅ Reset ${userType} wallet balance to 0`);
      }
    });
    
    localStorage.setItem('localWallets', JSON.stringify(localWallets));
    
    // Clear any cached user data that might have incorrect credit score
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.creditScore && user.creditScore === 650) {
          user.creditScore = 0;
          localStorage.setItem('user', JSON.stringify(user));
          console.log('✅ Reset user credit score to 0');
        }
      } catch (e) {
        console.log('No user data to clear');
      }
    }
    
  } catch (error) {
    console.error('Error clearing wallet data:', error);
  }
};

export default clearIncorrectWalletData;
