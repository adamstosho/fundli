const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function testPoolCreation() {
  try {
    console.log('Testing pool creation API...');
    
    // Find a lender user
    const lender = await User.findOne({ userType: 'lender' });
    if (!lender) {
      console.log('❌ No lender user found');
      return;
    }
    
    console.log('Found lender:', lender.email, lender.userType);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: lender._id, 
        userType: lender.userType,
        email: lender.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Generated token:', token.substring(0, 50) + '...');
    
    // Test pool creation
    const poolData = {
      name: 'Test Pool',
      description: 'This is a test pool',
      poolSize: 10000,
      duration: 12,
      interestRate: 5.5,
      minInvestment: 100,
      maxInvestment: 5000,
      riskLevel: 'medium',
      currency: 'USD'
    };
    
    console.log('Creating pool with data:', poolData);
    
    const response = await axios.post('http://localhost:5000/api/pools', poolData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pool creation successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  } finally {
    mongoose.connection.close();
  }
}

testPoolCreation();


