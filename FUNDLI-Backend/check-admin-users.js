const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function checkAdminUsers() {
  try {
    console.log('Checking for admin users...');
    
    const adminUsers = await User.find({ userType: 'admin' });
    console.log('Found admin users:', adminUsers.length);
    
    adminUsers.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log('  Email:', admin.email);
      console.log('  UserType:', admin.userType);
      console.log('  FirstName:', admin.firstName);
      console.log('  LastName:', admin.lastName);
      console.log('  ID:', admin._id);
      console.log('---');
    });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating one...');
      
      const bcrypt = require('bcryptjs');
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
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminUsers();


