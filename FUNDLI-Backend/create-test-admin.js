const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function createTestAdmin() {
  try {
    console.log('Creating test admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      console.log('Admin userType:', existingAdmin.userType);
      return existingAdmin;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: hashedPassword,
      phone: '+1234567890',
      userType: 'admin',
      isEmailVerified: true,
      creditScore: 0
    });

    await admin.save();
    console.log('✅ Test admin created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    console.log('UserType:', admin.userType);
    
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestAdmin();
