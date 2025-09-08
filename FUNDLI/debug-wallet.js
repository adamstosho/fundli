// Quick fix for wallet loading issues
// Add this to your browser console to debug wallet issues

const debugWallet = () => {
  console.log('🔍 Debugging Wallet Loading...\n');
  
  // Check authentication
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  
  console.log('1️⃣ Authentication Status:');
  if (token && user) {
    console.log('✅ User is logged in');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', JSON.parse(user).email);
  } else {
    console.log('❌ User not logged in');
    console.log('💡 Please login first at /login');
    return;
  }
  
  // Test wallet API
  console.log('\n2️⃣ Testing Wallet API:');
  fetch('http://localhost:5000/api/wallet', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => {
    console.log('📡 Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    if (data.status === 'success') {
      console.log('✅ Wallet loaded successfully:', data.data.wallet);
    } else {
      console.log('❌ Wallet API Error:', data.message);
      
      if (data.message.includes('Wallet not found')) {
        console.log('💡 Creating wallet...');
        return fetch('http://localhost:5000/api/wallet/create', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    }
  })
  .then(response => {
    if (response) {
      return response.json();
    }
  })
  .then(data => {
    if (data && data.status === 'success') {
      console.log('✅ Wallet created successfully:', data.data.wallet);
    }
  })
  .catch(error => {
    console.log('❌ Network Error:', error.message);
    console.log('💡 Check if backend server is running on port 5000');
  });
};

// Run debug
debugWallet();
