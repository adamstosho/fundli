require('dotenv').config();

// Test Paystack configuration
const testPaystackConfig = () => {
  console.log('🧪 Testing Paystack Configuration...\n');
  
  // Check environment variables
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
  const paystackBaseUrl = process.env.PAYSTACK_BASE_URL;
  
  console.log('1️⃣ Environment Variables Check:');
  console.log('   PAYSTACK_SECRET_KEY:', paystackSecretKey ? '✅ Set' : '❌ Missing');
  console.log('   PAYSTACK_PUBLIC_KEY:', paystackPublicKey ? '✅ Set' : '❌ Missing');
  console.log('   PAYSTACK_BASE_URL:', paystackBaseUrl ? '✅ Set' : '❌ Missing');
  
  if (paystackSecretKey && paystackPublicKey) {
    console.log('\n2️⃣ Key Format Check:');
    console.log('   Secret Key Format:', paystackSecretKey.startsWith('sk_') ? '✅ Valid' : '❌ Invalid');
    console.log('   Public Key Format:', paystackPublicKey.startsWith('pk_') ? '✅ Valid' : '❌ Invalid');
    
    console.log('\n3️⃣ Key Values:');
    console.log('   Secret Key:', paystackSecretKey.substring(0, 20) + '...');
    console.log('   Public Key:', paystackPublicKey.substring(0, 20) + '...');
  } else {
    console.log('\n❌ Paystack keys not properly configured');
    console.log('💡 Make sure PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY are set in .env file');
  }
  
  console.log('\n4️⃣ Wallet Controller Check:');
  try {
    const walletController = require('./src/controllers/walletController');
    console.log('   ✅ Wallet controller loaded successfully');
    
    // Check if handleCardPayment function exists
    if (typeof walletController.handleCardPayment === 'function') {
      console.log('   ✅ handleCardPayment function exists');
    } else {
      console.log('   ❌ handleCardPayment function not found');
    }
  } catch (error) {
    console.log('   ❌ Error loading wallet controller:', error.message);
  }
};

// Run the test
testPaystackConfig();
