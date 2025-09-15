// Wallet utility functions for managing wallet balance updates

/**
 * Trigger a wallet balance update event for a specific user
 * @param {string} userId - The user ID
 * @param {string} userType - The user type (borrower, lender, admin)
 * @param {number} newBalance - The new wallet balance (optional)
 */
export const triggerWalletBalanceUpdate = (userId, userType, newBalance = null) => {
  console.log('🔄 Triggering wallet balance update:', { userId, userType, newBalance });
  
  window.dispatchEvent(new CustomEvent('walletBalanceUpdated', { 
    detail: { 
      userId, 
      userType, 
      newBalance 
    } 
  }));
};

/**
 * Trigger a dashboard refresh event
 */
export const triggerDashboardRefresh = () => {
  console.log('🔄 Triggering dashboard refresh');
  window.dispatchEvent(new CustomEvent('dashboardRefreshed'));
};

/**
 * Update local wallet storage for a user type
 * @param {string} userType - The user type (borrower, lender, admin)
 * @param {number} newBalance - The new wallet balance
 */
export const updateLocalWallet = (userType, newBalance) => {
  try {
    const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
    
    if (localWallets[userType]) {
      localWallets[userType].balance = newBalance;
      localWallets[userType].updatedAt = new Date().toISOString();
      localStorage.setItem('localWallets', JSON.stringify(localWallets));
      
      console.log(`Updated local wallet for ${userType} to:`, newBalance);
    }
  } catch (error) {
    console.error('Error updating local wallet:', error);
  }
};

/**
 * Get the current user info from localStorage
 * @returns {Object} User info object
 */
export const getCurrentUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch (error) {
    console.error('Error getting user info:', error);
    return {};
  }
};

/**
 * Trigger wallet balance update for the current user
 * @param {number} newBalance - The new wallet balance (optional)
 */
export const triggerCurrentUserWalletUpdate = (newBalance = null) => {
  const userInfo = getCurrentUserInfo();
  triggerWalletBalanceUpdate(userInfo.id || userInfo._id, userInfo.userType, newBalance);
};

/**
 * Refresh wallet balance after a transaction
 * @param {string} transactionType - The type of transaction (deposit, transfer, etc.)
 * @param {number} amount - The transaction amount
 * @param {boolean} isIncrease - Whether the balance increases (true) or decreases (false)
 */
export const refreshWalletAfterTransaction = (transactionType, amount, isIncrease = true) => {
  const userInfo = getCurrentUserInfo();
  
  console.log('🔄 Refreshing wallet after transaction:', { 
    transactionType, 
    amount, 
    isIncrease, 
    userType: userInfo.userType 
  });
  
  // Trigger wallet balance update
  triggerCurrentUserWalletUpdate();
  
  // Trigger dashboard refresh
  triggerDashboardRefresh();
  
  // Update local storage if we have the current balance
  const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
  const currentBalance = localWallets[userInfo.userType]?.balance || 0;
  const newBalance = isIncrease ? currentBalance + amount : currentBalance - amount;
  
  updateLocalWallet(userInfo.userType, newBalance);
};
