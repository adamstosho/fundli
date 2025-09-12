const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection and models
async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    // Test Collateral model
    console.log('📄 Testing Collateral model...');
    const Collateral = require('./src/models/Collateral');
    
    // Check if there are any collateral records
    const totalCollateral = await Collateral.countDocuments();
    console.log(`📊 Total collateral records: ${totalCollateral}`);
    
    // Check different statuses
    const pendingCount = await Collateral.countDocuments({ verificationStatus: 'pending' });
    const submittedCount = await Collateral.countDocuments({ verificationStatus: 'submitted' });
    const approvedCount = await Collateral.countDocuments({ verificationStatus: 'approved' });
    const deletedCount = await Collateral.countDocuments({ verificationStatus: 'deleted' });
    
    console.log(`📋 Status breakdown:`);
    console.log(`   - Pending: ${pendingCount}`);
    console.log(`   - Submitted: ${submittedCount}`);
    console.log(`   - Approved: ${approvedCount}`);
    console.log(`   - Deleted: ${deletedCount}`);
    
    // Test User model
    console.log('👤 Testing User model...');
    const User = require('./src/models/User');
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users: ${totalUsers}`);
    
    // Test Loan model
    console.log('💰 Testing Loan model...');
    const Loan = require('./src/models/Loan');
    const totalLoans = await Loan.countDocuments();
    console.log(`📊 Total loans: ${totalLoans}`);
    
    console.log('✅ All models loaded successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the test
testDatabaseConnection();
