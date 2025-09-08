// Debug script to check wallet loading issues
const debugWalletLoading = () => {
  console.log('🔍 Debugging Wallet Loading Issues...\n');

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.log('❌ This script must run in browser environment');
    return;
  }

  // Check localStorage for token
  const token = localStorage.getItem('accessToken');
  console.log('1️⃣ Token check:');
  if (token) {
    console.log('✅ Token found:', token.substring(0, 20) + '...');
  } else {
    console.log('❌ No token found in localStorage');
    console.log('💡 User needs to login first');
    return;
  }

  // Test API endpoint
  console.log('\n2️⃣ Testing API endpoint...');
  fetch('http://localhost:5000/api/wallet', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => {
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      return response.json();
    } else {
      return response.json().then(error => {
        console.log('❌ API Error:', error);
        throw new Error(error.message || 'API request failed');
      });
    }
  })
  .then(data => {
    console.log('✅ Wallet data received:', data);
  })
  .catch(error => {
    console.log('❌ Fetch error:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.log('💡 Possible issues:');
      console.log('   - Backend server not running');
      console.log('   - CORS issues');
      console.log('   - Network connectivity');
    } else if (error.message.includes('Token is not valid')) {
      console.log('💡 Token expired or invalid - user needs to login again');
    } else if (error.message.includes('Wallet not found')) {
      console.log('💡 Wallet needs to be created first');
    }
  });

  // Check if user is logged in
  console.log('\n3️⃣ User authentication check:');
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    console.log('✅ User data found:', {
      email: user.email,
      userType: user.userType,
      id: user.id
    });
  } else {
    console.log('❌ No user data found');
    console.log('💡 User needs to login');
  }

  // Check network connectivity
  console.log('\n4️⃣ Network connectivity check:');
  fetch('http://localhost:5000/api/health')
    .then(response => {
      if (response.ok) {
        console.log('✅ Backend server is reachable');
      } else {
        console.log('⚠️ Backend server responded with error:', response.status);
      }
    })
    .catch(error => {
      console.log('❌ Cannot reach backend server:', error.message);
      console.log('💡 Make sure backend is running on port 5000');
    });
};

// Run debug if in browser
if (typeof window !== 'undefined') {
  debugWalletLoading();
} else {
  console.log('Run this script in browser console to debug wallet loading issues');
}
