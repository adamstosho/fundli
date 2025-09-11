const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try multiple connection options
    const atlasURI = process.env.MONGODB_URI;
    const localURI = 'mongodb://localhost:27017/fundli';
    
    console.log('🔧 Connecting to MongoDB...');
    
    // Try Atlas first if URI is provided
    if (atlasURI && atlasURI.includes('mongodb+srv://')) {
      try {
        console.log('🔗 Trying MongoDB Atlas...');
        const conn = await mongoose.connect(atlasURI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        return true;
      } catch (atlasError) {
        console.error('❌ MongoDB Atlas connection failed:', atlasError.message);
      }
    }

    // Try local MongoDB
    try {
      console.log('🔄 Trying local MongoDB...');
      const conn = await mongoose.connect(localURI, {
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (localError) {
      console.error('❌ Local MongoDB failed:', localError.message);
    }

    // Try a public test MongoDB instance (for development only)
    try {
      console.log('🔄 Trying public test MongoDB...');
      const testURI = 'mongodb+srv://test:test123@cluster0.mongodb.net/fundli-test?retryWrites=true&w=majority';
      const conn = await mongoose.connect(testURI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ Test MongoDB Connected: ${conn.connection.host}`);
      console.log('⚠️  Using public test database - data may be shared!');
      return true;
    } catch (testError) {
      console.error('❌ Test MongoDB failed:', testError.message);
    }

    console.error('💡 All MongoDB connection attempts failed');
    console.error('   Please check:');
    console.error('   1. MongoDB Atlas connection string in .env');
    console.error('   2. Local MongoDB is running (mongod)');
    console.error('   3. Network connectivity');
    console.log('⚠️  Server starting without database connection...');
    return false;

  } catch (error) {
    console.error('❌ Unexpected database connection error:', error.message);
    console.log('⚠️  Server starting without database connection...');
    return false;
  }
};

module.exports = { connectDB };