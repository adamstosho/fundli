const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestLender() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if test lender already exists
    const existingLender = await User.findOne({ email: 'lender@test.com' });
    if (existingLender) {
      console.log('Test lender already exists:', existingLender.email);
      console.log('Password: TestPassword123!');
      process.exit(0);
    }

    // Create test lender
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    const testLender = new User({
      firstName: 'Test',
      lastName: 'Lender',
      email: 'lender@test.com',
      phone: '+1234567890',
      password: hashedPassword,
      userType: 'lender',
      kycStatus: 'approved',
      isEmailVerified: true,
      creditScore: 0
    });

    await testLender.save();
    console.log('✅ Test lender created successfully!');
    console.log('Email: lender@test.com');
    console.log('Password: TestPassword123!');
    console.log('User Type: lender');
    
  } catch (error) {
    console.error('Error creating test lender:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestLender();

