// Test script to check browse button functionality
import axios from 'axios';

const API_BASE_URL = 'https://fundli-hjqn.vercel.app/api';

async function testBrowseButton() {
  try {
    console.log('🧪 Testing Browse Button Functionality...\n');

    // Step 1: Check API connectivity
    console.log('1. Testing API connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Backend API is accessible');
    } catch (error) {
      console.log('❌ Backend API is not accessible:', error.message);
      return;
    }

    // Step 2: Test approved borrowers API
    console.log('\n2. Testing approved borrowers API...');
    try {
      // This would normally require authentication, but let's check if the endpoint exists
      const response = await axios.get(`${API_BASE_URL}/wallet/approved-borrowers`);
      console.log('✅ Approved borrowers API is accessible');
      console.log('Response status:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API endpoint exists but requires authentication (expected)');
      } else {
        console.log('❌ API endpoint error:', error.response?.status, error.message);
      }
    }

    console.log('\n💡 Debugging steps:');
    console.log('1. Open browser developer console');
    console.log('2. Go to Transfer page');
    console.log('3. Check for any JavaScript errors');
    console.log('4. Check if approvedBorrowers array is loaded');
    console.log('5. Check if openBrowseModal function is defined');

    console.log('\n🔍 What to check in browser console:');
    console.log('- Any JavaScript errors');
    console.log('- "Error loading approved borrowers:" messages');
    console.log('- Network requests to /api/wallet/approved-borrowers');
    console.log('- approvedBorrowers array length');

    console.log('\n🛠️ Potential fixes:');
    console.log('1. Check if user is logged in');
    console.log('2. Check if API endpoint is working');
    console.log('3. Check if there are any JavaScript errors');
    console.log('4. Check if approvedBorrowers state is being set');

    console.log('\n📋 Expected behavior:');
    console.log('- Button should be clickable (not disabled)');
    console.log('- Button should have accent-600 background color');
    console.log('- Clicking should open browse modal');
    console.log('- Modal should show approved borrowers list');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBrowseButton();









