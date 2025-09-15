const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function debugBorrowerAuth() {
  try {
    console.log('Debugging borrower authentication...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
    
    // Find borrower user
    const borrower = await User.findOne({ userType: 'borrower' });
    if (!borrower) {
      console.log('❌ No borrower user found');
      return;
    }
    
    console.log('Borrower details:');
    console.log('  ID:', borrower._id);
    console.log('  Email:', borrower.email);
    console.log('  UserType:', borrower.userType);
    console.log('  IsActive:', borrower.isActive);
    console.log('  IsEmailVerified:', borrower.isEmailVerified);
    
    // Test JWT creation and verification
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('Using JWT secret:', jwtSecret.substring(0, 10) + '...');
    
    // Create token
    const token = jwt.sign(
      { 
        id: borrower._id, 
        userType: borrower.userType,
        email: borrower.email 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log('Created token:', token.substring(0, 50) + '...');
    
    // Verify token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token verification successful');
      console.log('Decoded token:', decoded);
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.message);
    }
    
    // Test with different JWT secrets
    const testSecrets = [
      'your-secret-key',
      'fundli-secret-key',
      'my-secret-key',
      'jwt-secret-key'
    ];
    
    for (const secret of testSecrets) {
      try {
        const testToken = jwt.sign({ id: borrower._id }, secret, { expiresIn: '7d' });
        const decoded = jwt.verify(testToken, secret);
        console.log(`✅ Token works with secret: ${secret}`);
      } catch (error) {
        console.log(`❌ Token fails with secret: ${secret}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugBorrowerAuth();


