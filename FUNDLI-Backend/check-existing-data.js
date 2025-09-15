const mongoose = require('mongoose');

// Try to connect to MongoDB using the same connection string as the server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fundli:fundli123@cluster0.vixdbhc.mongodb.net/fundli?retryWrites=true&w=majority';

async function checkExistingData() {
  try {
    console.log('🔍 Checking existing data in database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if we can access the models
    const Loan = require('./src/models/Loan');
    const User = require('./src/models/User');
    const Notification = require('./src/models/Notification');

    // Check users
    const userCount = await User.countDocuments();
    console.log('👥 Total users in database:', userCount);
    
    const lenders = await User.find({ userType: 'lender' });
    console.log('👤 Lenders:', lenders.length);
    lenders.forEach(lender => {
      console.log(`  - ${lender.firstName} ${lender.lastName} (${lender.email})`);
    });

    const borrowers = await User.find({ userType: 'borrower' });
    console.log('👤 Borrowers:', borrowers.length);
    borrowers.forEach(borrower => {
      console.log(`  - ${borrower.firstName} ${borrower.lastName} (${borrower.email})`);
    });

    const admins = await User.find({ userType: 'admin' });
    console.log('👤 Admins:', admins.length);
    admins.forEach(admin => {
      console.log(`  - ${admin.firstName} ${admin.lastName} (${admin.email})`);
    });

    // Check loans
    const loanCount = await Loan.countDocuments();
    console.log('📝 Total loans in database:', loanCount);
    
    const pendingLoans = await Loan.find({ status: 'pending' });
    console.log('⏳ Pending loans:', pendingLoans.length);
    
    const approvedLoans = await Loan.find({ status: 'approved' });
    console.log('✅ Approved loans:', approvedLoans.length);
    
    const fundedLoans = await Loan.find({ status: 'funded' });
    console.log('💰 Funded loans:', fundedLoans.length);

    // Check notifications
    const notificationCount = await Notification.countDocuments();
    console.log('🔔 Total notifications in database:', notificationCount);
    
    const lenderNotifications = await Notification.find({ 
      'metadata.action': 'view_loan' 
    });
    console.log('🔔 Lender notifications:', lenderNotifications.length);

    // Show recent loans
    const recentLoans = await Loan.find({})
      .populate('borrower', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('📊 Recent loans:');
    recentLoans.forEach(loan => {
      console.log(`  - ${loan._id}: ${loan.status} | ${loan.borrower?.firstName} ${loan.borrower?.lastName} | $${loan.loanAmount} | ${loan.purpose}`);
    });

    // Show recent notifications
    const recentNotifications = await Notification.find({})
      .populate('recipient', 'firstName lastName email userType')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('📊 Recent notifications:');
    recentNotifications.forEach(notif => {
      console.log(`  - ${notif._id}: ${notif.title} | ${notif.recipient?.firstName} ${notif.recipient?.lastName} (${notif.recipient?.userType}) | ${notif.status}`);
    });

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkExistingData();


