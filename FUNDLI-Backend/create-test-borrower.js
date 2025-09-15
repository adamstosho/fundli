const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestBorrower() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if test borrower already exists
    const existingBorrower = await User.findOne({ email: 'borrower@test.com' });
    if (existingBorrower) {
      console.log('Test borrower already exists:', existingBorrower.email);
      console.log('Password: TestPassword123!');
      process.exit(0);
    }

    // Create test borrower
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    const testBorrower = new User({
      firstName: 'Test',
      lastName: 'Borrower',
      email: 'borrower@test.com',
      phone: '+1234567891',
      password: hashedPassword,
      userType: 'borrower',
      kycStatus: 'approved',
      isEmailVerified: true,
      creditScore: 0
    });

    await testBorrower.save();
    console.log('✅ Test borrower created successfully!');
    console.log('Email: borrower@test.com');
    console.log('Password: TestPassword123!');
    console.log('User Type: borrower');
    
  } catch (error) {
    console.error('Error creating test borrower:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestBorrower();

