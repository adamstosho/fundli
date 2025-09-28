const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function testAdminAuth() {
  try {
    console.log('Testing admin authentication...');
    
    // Find admin user
    const admin = await User.findOne({ userType: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }
    
    console.log('Found admin:', admin.email, admin.userType);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        userType: admin.userType,
        email: admin.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Generated token:', token.substring(0, 50) + '...');
    
    // Test API call
    const axios = require('axios');
    const response = await axios.get('https://fundli-hjqn.vercel.app/api/feedback', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API call successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    mongoose.connection.close();
  }
}

testAdminAuth();


