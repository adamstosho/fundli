import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased to 30 seconds for registration
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug logging
console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Verify OTP
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  
  // Resend OTP
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  // Change password
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Get current user
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: () => api.get('/users/profile'),
  
  // Update user profile
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  
  // Upload KYC documents
  uploadKYC: (formData) => api.post('/users/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  // Get KYC status
  getKYCStatus: () => api.get('/users/kyc/status'),
  
  // Update wallet balance
  getWalletBalance: () => api.get('/users/wallet'),
  
  // Fund wallet
  fundWallet: (amount, paymentMethod) => 
    api.post('/users/wallet/fund', { amount, paymentMethod }),
  
  // Withdraw from wallet
  withdrawFromWallet: (amount, bankDetails) => 
    api.post('/users/wallet/withdraw', { amount, bankDetails }),
};

// Loan API
export const loanAPI = {
  // Apply for loan
  applyForLoan: (loanData) => api.post('/loans/apply', loanData),
  
  // Get user loans
  getUserLoans: () => api.get('/loans/user'),
  
  // Get loan details
  getLoanDetails: (loanId) => api.get(`/loans/${loanId}`),
  
  // Get loan status
  getLoanStatus: (loanId) => api.get(`/loans/${loanId}/status`),
  
  // Get repayment schedule
  getRepaymentSchedule: (loanId) => api.get(`/loans/${loanId}/repayments`),
  
  // Make loan repayment
  makeRepayment: (loanId, amount, paymentMethod) => 
    api.post(`/loans/${loanId}/repay`, { amount, paymentMethod }),
  
  // Upload loan collateral
  uploadCollateral: (loanId, formData) => 
    api.post(`/loans/${loanId}/collateral`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Lending Pool API
export const poolAPI = {
  // Create lending pool
  createPool: (poolData) => api.post('/pools/create', poolData),
  
  // Get user pools
  getUserPools: () => api.get('/pools/user'),
  
  // Get pool details
  getPoolDetails: (poolId) => api.get(`/pools/${poolId}`),
  
  // Invest in pool
  investInPool: (poolId, amount) => api.post(`/pools/${poolId}/invest`, { amount }),
  
  // Get pool performance
  getPoolPerformance: (poolId) => api.get(`/pools/${poolId}/performance`),
  
  // Close pool
  closePool: (poolId) => api.post(`/pools/${poolId}/close`),
};

// Marketplace API
export const marketplaceAPI = {
  // Get available loans
  getAvailableLoans: (filters = {}) => api.get('/marketplace/loans', { params: filters }),
  
  // Get loan details for marketplace
  getMarketplaceLoan: (loanId) => api.get(`/marketplace/loans/${loanId}`),
  
  // Get available pools
  getAvailablePools: (filters = {}) => api.get('/marketplace/pools', { params: filters }),
  
  // Get pool details for marketplace
  getMarketplacePool: (poolId) => api.get(`/marketplace/pools/${poolId}`),
  
  // Search loans
  searchLoans: (query) => api.get('/marketplace/search/loans', { params: { q: query } }),
  
  // Search pools
  searchPools: (query) => api.get('/marketplace/search/pools', { params: { q: query } }),
};

// Referral API
export const referralAPI = {
  // Get referral stats
  getReferralStats: () => api.get('/referrals/stats'),
  
  // Get referral history
  getReferralHistory: () => api.get('/referrals/history'),
  
  // Generate referral link
  generateReferralLink: () => api.post('/referrals/generate-link'),
  
  // Get referral rewards
  getReferralRewards: () => api.get('/referrals/rewards'),
  
  // Claim referral reward
  claimReferralReward: (rewardId) => api.post(`/referrals/rewards/${rewardId}/claim`),
};

// Transaction API
export const transactionAPI = {
  // Get user transactions
  getUserTransactions: (filters = {}) => 
    api.get('/transactions/user', { params: filters }),
  
  // Get transaction details
  getTransactionDetails: (transactionId) => 
    api.get(`/transactions/${transactionId}`),
  
  // Get transaction stats
  getTransactionStats: () => api.get('/transactions/stats'),
  
  // Verify payment
  verifyPayment: (transactionId) => api.post(`/transactions/${transactionId}/verify`),
};

// Notification API
export const notificationAPI = {
  // Get user notifications
  getUserNotifications: () => api.get('/notifications'),
  
  // Mark notification as read
  markAsRead: (notificationId) => 
    api.put(`/notifications/${notificationId}/read`),
  
  // Mark all notifications as read
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Delete notification
  deleteNotification: (notificationId) => 
    api.delete(`/notifications/${notificationId}`),
  
  // Update notification preferences
  updatePreferences: (preferences) => 
    api.put('/notifications/preferences', preferences),
};

// Admin API (only for admin users)
export const adminAPI = {
  // User management
  getAllUsers: (filters = {}) => api.get('/admin/users', { params: filters }),
  updateUserStatus: (userId, status) => 
    api.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // KYC management
  getPendingKYC: () => api.get('/admin/kyc/pending'),
  approveKYC: (userId) => api.post(`/admin/kyc/${userId}/approve`),
  rejectKYC: (userId, reason) => 
    api.post(`/admin/kyc/${userId}/reject`, { reason }),
  
  // Loan management
  getAllLoans: (filters = {}) => api.get('/admin/loans', { params: filters }),
  approveLoan: (loanId) => api.post(`/admin/loans/${loanId}/approve`),
  rejectLoan: (loanId, reason) => 
    api.post(`/admin/loans/${loanId}/reject`, { reason }),
  
  // Platform stats
  getPlatformStats: () => api.get('/admin/stats'),
  getTransactionHistory: (filters = {}) => 
    api.get('/admin/transactions', { params: filters }),
};

// Error handling utility
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { type: 'validation', message: data.message || 'Invalid request' };
      case 401:
        return { type: 'auth', message: 'Please log in again' };
      case 403:
        return { type: 'permission', message: 'You don\'t have permission for this action' };
      case 404:
        return { type: 'not_found', message: 'Resource not found' };
      case 422:
        return { type: 'validation', message: data.message || 'Validation failed' };
      case 429:
        return { type: 'rate_limit', message: 'Too many requests. Please try again later.' };
      case 500:
        return { type: 'server', message: 'Server error. Please try again later.' };
      default:
        return { type: 'unknown', message: data.message || 'An error occurred' };
    }
  } else if (error.request) {
    // Network error
    return { type: 'network', message: 'Network error. Please check your connection.' };
  } else {
    // Other error
    return { type: 'unknown', message: error.message || 'An error occurred' };
  }
};

export default api; 